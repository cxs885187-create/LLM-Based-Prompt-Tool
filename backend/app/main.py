import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import text

from app.api.v1 import comment, experiment
from app.core.config import settings
from app.core.security import limiter
from app.db.session import engine
from app.models import record


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _ensure_sqlite_compatibility() -> None:
    if not settings.database_url.startswith("sqlite"):
        return

    with engine.begin() as connection:
        existing_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(experiment_records)")).fetchall()
        }
        if "status" not in existing_columns:
            connection.execute(
                text(
                    "ALTER TABLE experiment_records "
                    "ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'initialized'"
                )
            )


# Keep auto table creation for local development only.
record.Base.metadata.create_all(bind=engine)
_ensure_sqlite_compatibility()

app = FastAPI(title="Experiment Backend API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

app.include_router(experiment.router, prefix="/api/v1/experiment", tags=["experiment"])
app.include_router(comment.router, prefix="/api/v1/comment", tags=["comment"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Experiment backend is running."}
