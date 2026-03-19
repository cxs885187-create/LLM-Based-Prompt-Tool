from typing import Literal, Optional

from pydantic import BaseModel, Field


class ExperimentInitRequest(BaseModel):
    session_id: Optional[str] = None
    scenario_id: str = Field(..., description="Scenario identifier")


class ExperimentInitResponse(BaseModel):
    experiment_id: str
    group: str
    scenario_id: str


class CommentCheckRequest(BaseModel):
    experiment_id: str
    comment_text: str = Field(..., min_length=1, max_length=500)


class CommentCheckResponse(BaseModel):
    is_uncivil: bool
    prompt_text: Optional[str] = None
    prompt_type: Optional[str] = None
    prompt_source: Optional[Literal["llm", "fallback", "mock"]] = None


class CommentActionRequest(BaseModel):
    experiment_id: str
    action: Literal["post", "modify", "cancel"]
    modified_comment: Optional[str] = Field(default=None, min_length=1, max_length=500)


class CommentActionResponse(BaseModel):
    success: bool


class PromptAllocationUpdateRequest(BaseModel):
    empathy: int = Field(default=1, ge=0)
    consequence: int = Field(default=1, ge=0)
    normative: int = Field(default=1, ge=0)
    alternative: int = Field(default=1, ge=0)
    control: int = Field(default=1, ge=0)


class PromptAllocationResponse(BaseModel):
    weights: dict[str, int]
    normalized_ratio: dict[str, float]
    total_weight: int
    updated_at: Optional[str] = None
