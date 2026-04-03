from typing import Literal, Optional

from pydantic import BaseModel, Field


class PreSurveyPayload(BaseModel):
    education_level: Literal["lower_undergraduate", "upper_undergraduate", "postgraduate", "other"]
    primary_platform: Literal["campus_wall", "weibo", "xiaohongshu", "bilibili", "other"]
    commenting_frequency: Literal["rarely", "occasionally", "weekly", "almost_daily"]
    civility_confidence: int = Field(..., ge=1, le=5)


class PromptFeedbackPayload(BaseModel):
    helpfulness: int = Field(..., ge=1, le=5)
    friendliness: int = Field(..., ge=1, le=5)
    relevance: int = Field(..., ge=1, le=5)


class PostSurveyPayload(BaseModel):
    reflection_gain: int = Field(..., ge=1, le=5)
    real_world_adoption: int = Field(..., ge=1, le=5)
    open_feedback: Optional[str] = Field(default="", max_length=300)


class ExperimentInitRequest(BaseModel):
    session_id: Optional[str] = None
    scenario_id: str = Field(..., description="Scenario identifier")
    pre_survey: Optional[PreSurveyPayload] = None


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
    risk_features: list[str] = Field(default_factory=list)


class CommentActionRequest(BaseModel):
    experiment_id: str
    action: Literal["post", "modify", "cancel"]
    modified_comment: Optional[str] = Field(default=None, min_length=1, max_length=500)


class CommentActionResponse(BaseModel):
    success: bool


class ExperimentFeedbackRequest(BaseModel):
    experiment_id: str
    prompt_feedback: Optional[PromptFeedbackPayload] = None
    post_survey: Optional[PostSurveyPayload] = None
    decision_latency_ms: Optional[int] = Field(default=None, ge=0, le=600000)


class ExperimentFeedbackResponse(BaseModel):
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
