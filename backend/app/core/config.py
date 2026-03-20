import json
import os
from pathlib import Path
from typing import Any

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SQLITE_URL = f"sqlite:///{(BASE_DIR / 'test.db').as_posix()}"


def _is_vercel_runtime() -> bool:
    return os.getenv("VERCEL") == "1" or bool(os.getenv("VERCEL_ENV"))


class Settings(BaseSettings):
    # Always load backend/.env no matter where uvicorn is launched from.
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database settings are kept for future migration, while SQLite stays default.
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = ""
    db_name: str = "test"
    database_url: str = DEFAULT_SQLITE_URL

    # LLM provider settings (GLM-4 compatible)
    aigc_api_url: str = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    aigc_api_key: str = "test_key"
    aigc_model: str = "glm-4-flash"
    llm_timeout_seconds: float = 8.0
    llm_connect_timeout_seconds: float = 3.0
    llm_retries: int = 1
    llm_failure_threshold: int = 3
    llm_cooldown_seconds: int = 45
    llm_max_concurrency: int = 8
    secret_key: str = "dev_secret_key"
    admin_token: str = "change_me_admin_token"

    use_mock_llm: bool = True
    cors_origins: str = "http://localhost:5173"

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: Any) -> str:
        raw = str(value).strip() if value is not None else DEFAULT_SQLITE_URL
        if not raw:
            return DEFAULT_SQLITE_URL
        if raw.startswith("postgres://"):
            return raw.replace("postgres://", "postgresql://", 1)
        return raw

    @field_validator("cors_origins", mode="before")
    @classmethod
    def normalize_cors_origins(cls, value: Any) -> str:
        if value is None:
            return "http://localhost:5173"

        if isinstance(value, (list, tuple, set)):
            origins = [
                str(origin).strip().rstrip("/")
                for origin in value
                if str(origin).strip()
            ]
            return ",".join(origins)

        raw = str(value).strip()
        if not raw:
            return ""

        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError:
                parsed = None
            if isinstance(parsed, list):
                origins = [
                    str(origin).strip().rstrip("/")
                    for origin in parsed
                    if str(origin).strip()
                ]
                return ",".join(origins)

        origins = [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]
        return ",".join(origins)

    @model_validator(mode="after")
    def validate_runtime_settings(self):
        if _is_vercel_runtime() and self.database_url.startswith("sqlite"):
            raise ValueError(
                "DATABASE_URL must point to an external database when deploying to Vercel."
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip().rstrip("/") for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
