import datetime
import enum

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.orm import declarative_base


Base = declarative_base()


class FinalActionEnum(str, enum.Enum):
    POST = "post"
    MODIFY = "modify"
    CANCEL = "cancel"


class ExperimentStatusEnum(str, enum.Enum):
    INITIALIZED = "initialized"
    CHECKED = "checked"
    COMPLETED = "completed"


class ExperimentRecord(Base):
    __tablename__ = "experiment_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    experiment_id = Column(String(36), unique=True, nullable=False, index=True)
    session_id = Column(String(255), nullable=True)
    scenario_id = Column(String(50), nullable=False)
    group = Column(String(20), nullable=False)

    original_comment = Column(Text, nullable=True)
    prompt_type = Column(String(20), nullable=True)
    generated_prompt = Column(Text, nullable=True)

    # Use string for broad SQLite compatibility and backward-safe reads.
    final_action = Column(String(20), nullable=True)
    modified_comment = Column(Text, nullable=True)

    status = Column(
        String(20),
        nullable=False,
        default=ExperimentStatusEnum.INITIALIZED.value,
    )

    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )


class PromptAllocationConfig(Base):
    __tablename__ = "prompt_allocation_config"

    id = Column(Integer, primary_key=True, autoincrement=False, default=1)
    empathy_weight = Column(Integer, nullable=False, default=1)
    consequence_weight = Column(Integer, nullable=False, default=1)
    normative_weight = Column(Integer, nullable=False, default=1)
    alternative_weight = Column(Integer, nullable=False, default=1)
    control_weight = Column(Integer, nullable=False, default=1)
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
        nullable=False,
    )
