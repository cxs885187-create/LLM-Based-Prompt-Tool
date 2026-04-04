import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi import _rate_limit_exceeded_handler
from sqlalchemy import inspect, text

from app.api.v1 import comment, experiment
from app.core.config import settings
from app.core.security import limiter
from app.db.session import engine
from app.models import record


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _ensure_database_schema_compatibility() -> None:
    inspector = inspect(engine)
    if "experiment_records" not in inspector.get_table_names():
        return

    dialect = engine.dialect.name
    if dialect == "sqlite":
        column_specs = {
            "status": "VARCHAR(20) NOT NULL DEFAULT 'initialized'",
            "risk_features": "TEXT",
            "pre_survey": "TEXT",
            "prompt_feedback": "TEXT",
            "post_survey": "TEXT",
            "decision_latency_ms": "INTEGER",
        }
    else:
        column_specs = {
            "status": "VARCHAR(20) DEFAULT 'initialized'",
            "risk_features": "TEXT",
            "pre_survey": "TEXT",
            "prompt_feedback": "TEXT",
            "post_survey": "TEXT",
            "decision_latency_ms": "INTEGER",
        }

    existing_columns = {
        column["name"] for column in inspector.get_columns("experiment_records")
    }

    with engine.begin() as connection:
        for column_name, column_spec in column_specs.items():
            if column_name not in existing_columns:
                logger.info("Adding missing column %s to experiment_records", column_name)
                connection.execute(
                    text(
                        f"ALTER TABLE experiment_records "
                        f"ADD COLUMN {column_name} {column_spec}"
                    )
                )


# Bootstrap tables on the configured database connection.
record.Base.metadata.create_all(bind=engine)
_ensure_database_schema_compatibility()

app = FastAPI(title="Experiment Backend API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(experiment.router, prefix="/api/v1/experiment", tags=["experiment"])
app.include_router(comment.router, prefix="/api/v1/comment", tags=["comment"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Experiment backend is running."}
