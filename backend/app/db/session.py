from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


engine_kwargs = {"echo": False}
if settings.database_url.startswith("sqlite"):
    # Allow SQLite connections to be shared across FastAPI worker threads.
    # Add busy timeout to reduce transient "database is locked" failures.
    engine_kwargs["connect_args"] = {"check_same_thread": False, "timeout": 10}

engine = create_engine(settings.database_url, **engine_kwargs)

if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, _connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL;")
        cursor.execute("PRAGMA synchronous=NORMAL;")
        cursor.execute("PRAGMA busy_timeout=5000;")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
