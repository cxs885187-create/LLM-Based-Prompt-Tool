from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


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

    @property
    def database_url(self) -> str:
        return "sqlite:///./test.db"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
