import datetime
import json
import random
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import dependencies
from app.core.security import limiter, verify_admin_token
from app.models.record import (
    ExperimentRecord,
    ExperimentStatusEnum,
    FinalActionEnum,
    PromptAllocationConfig,
)
from app.schemas.dto import (
    ExperimentFeedbackRequest,
    ExperimentFeedbackResponse,
    ExperimentInitRequest,
    ExperimentInitResponse,
    PromptAllocationResponse,
    PromptAllocationUpdateRequest,
)


router = APIRouter()

GROUPS = ["empathy", "consequence", "normative", "alternative", "control"]


_ACTION_NORMALIZE_MAP = {
    "POST": "post",
    "MODIFY": "modify",
    "CANCEL": "cancel",
    "FINALACTIONENUM.POST": "post",
    "FINALACTIONENUM.MODIFY": "modify",
    "FINALACTIONENUM.CANCEL": "cancel",
}


def _get_or_create_allocation_config(db: Session) -> PromptAllocationConfig:
    config = db.query(PromptAllocationConfig).filter(PromptAllocationConfig.id == 1).first()
    if config:
        return config

    config = PromptAllocationConfig(id=1)
    db.add(config)
    db.commit()
    db.refresh(config)
    return config


def _weight_map_from_config(config: PromptAllocationConfig) -> dict[str, int]:
    return {
        "empathy": max(0, int(config.empathy_weight)),
        "consequence": max(0, int(config.consequence_weight)),
        "normative": max(0, int(config.normative_weight)),
        "alternative": max(0, int(config.alternative_weight)),
        "control": max(0, int(config.control_weight)),
    }


def _serialize_allocation(config: PromptAllocationConfig) -> dict:
    weights = _weight_map_from_config(config)
    total_weight = sum(weights.values())

    if total_weight <= 0:
        normalized_ratio = {group: 0.0 for group in GROUPS}
    else:
        normalized_ratio = {
            group: round(weights[group] / total_weight, 4)
            for group in GROUPS
        }

    return {
        "weights": weights,
        "normalized_ratio": normalized_ratio,
        "total_weight": total_weight,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }


def _assign_group_weighted_balanced(db: Session) -> str:
    config = _get_or_create_allocation_config(db)
    weights = _weight_map_from_config(config)

    active_groups = [group for group in GROUPS if weights[group] > 0]
    if not active_groups:
        active_groups = GROUPS
        weights = {group: 1 for group in GROUPS}

    grouped_counts = dict(
        db.query(ExperimentRecord.group, func.count(ExperimentRecord.id))
        .filter(ExperimentRecord.group.in_(active_groups))
        .group_by(ExperimentRecord.group)
        .all()
    )

    score_map = {
        group: grouped_counts.get(group, 0) / weights[group]
        for group in active_groups
    }
    min_score = min(score_map.values())
    candidate_groups = [
        group for group, score in score_map.items() if abs(score - min_score) < 1e-9
    ]
    return random.choice(candidate_groups)


def _apply_filters(query, scenario_id: str | None, group: str | None):
    if scenario_id:
        query = query.filter(ExperimentRecord.scenario_id == scenario_id)
    if group:
        query = query.filter(ExperimentRecord.group == group)
    return query


def _serialize_action(action_value):
    if isinstance(action_value, FinalActionEnum):
        return action_value.value
    if action_value is None:
        return None

    text_value = str(action_value)
    return _ACTION_NORMALIZE_MAP.get(text_value.upper(), text_value)


def _parse_json_field(value):
    if not value:
        return None
    try:
        return json.loads(value)
    except Exception:
        return None


def _resolve_final_submitted_comment(row: ExperimentRecord):
    action = _serialize_action(row.final_action)
    if action == "modify":
        return row.modified_comment
    if action == "post":
        return row.original_comment
    return None


def _serialize_record(row: ExperimentRecord) -> dict:
    return {
        "experiment_id": row.experiment_id,
        "session_id": row.session_id,
        "scenario_id": row.scenario_id,
        "group": row.group,
        "prompt_type": row.prompt_type or row.group,
        "triggered_prompt_type": row.prompt_type,
        "generated_prompt": row.generated_prompt,
        "risk_features": _parse_json_field(row.risk_features) or [],
        "original_comment": row.original_comment,
        "modified_comment": row.modified_comment,
        "final_submitted_comment": _resolve_final_submitted_comment(row),
        "final_action": _serialize_action(row.final_action),
        "pre_survey": _parse_json_field(row.pre_survey),
        "prompt_feedback": _parse_json_field(row.prompt_feedback),
        "post_survey": _parse_json_field(row.post_survey),
        "decision_latency_ms": row.decision_latency_ms,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def _safe_average(values: list[int | float]) -> float | None:
    return round(sum(values) / len(values), 2) if values else None


def _build_feedback_insights(rows: list[ExperimentRecord]) -> dict:
    prompt_feedback_rows = []
    post_survey_rows = []
    decision_latencies = []
    modify_count = 0
    completed_count = 0

    for row in rows:
        if row.status == ExperimentStatusEnum.COMPLETED.value:
            completed_count += 1

        action = _serialize_action(row.final_action)
        if action == "modify":
            modify_count += 1

        if row.decision_latency_ms is not None:
            decision_latencies.append(row.decision_latency_ms)

        prompt_feedback = _parse_json_field(row.prompt_feedback)
        if prompt_feedback:
            prompt_feedback_rows.append(prompt_feedback)

        post_survey = _parse_json_field(row.post_survey)
        if post_survey:
            post_survey_rows.append(post_survey)

    helpfulness = [item.get("helpfulness") for item in prompt_feedback_rows if item.get("helpfulness")]
    friendliness = [item.get("friendliness") for item in prompt_feedback_rows if item.get("friendliness")]
    relevance = [item.get("relevance") for item in prompt_feedback_rows if item.get("relevance")]
    reflection_gain = [item.get("reflection_gain") for item in post_survey_rows if item.get("reflection_gain")]
    real_world_adoption = [item.get("real_world_adoption") for item in post_survey_rows if item.get("real_world_adoption")]

    return {
        "modify_rate": round(modify_count / completed_count, 4) if completed_count else None,
        "avg_helpfulness": _safe_average(helpfulness),
        "avg_friendliness": _safe_average(friendliness),
        "avg_relevance": _safe_average(relevance),
        "avg_reflection_gain": _safe_average(reflection_gain),
        "avg_real_world_adoption": _safe_average(real_world_adoption),
        "avg_decision_latency_ms": _safe_average(decision_latencies),
        "feedback_count": len(post_survey_rows),
    }


@router.post("/init", response_model=ExperimentInitResponse)
@limiter.limit("10/minute")
def init_experiment(
    request: Request,
    payload: ExperimentInitRequest,
    db: Session = Depends(dependencies.get_db),
):
    group = _assign_group_weighted_balanced(db)
    experiment_id = str(uuid.uuid4())

    record = ExperimentRecord(
        experiment_id=experiment_id,
        session_id=payload.session_id,
        scenario_id=payload.scenario_id,
        group=group,
        pre_survey=json.dumps(payload.pre_survey.model_dump(), ensure_ascii=False) if payload.pre_survey else None,
        status=ExperimentStatusEnum.INITIALIZED.value,
    )
    db.add(record)
    db.commit()

    return ExperimentInitResponse(
        experiment_id=experiment_id,
        group=group,
        scenario_id=payload.scenario_id,
    )


@router.post("/feedback", response_model=ExperimentFeedbackResponse)
def submit_experiment_feedback(
    payload: ExperimentFeedbackRequest,
    db: Session = Depends(dependencies.get_db),
):
    record = db.query(ExperimentRecord).filter(
        ExperimentRecord.experiment_id == payload.experiment_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment record not found.")

    if record.status != ExperimentStatusEnum.COMPLETED.value:
        raise HTTPException(status_code=400, detail="Experiment is not completed yet.")

    if payload.prompt_feedback:
        record.prompt_feedback = json.dumps(payload.prompt_feedback.model_dump(), ensure_ascii=False)
    if payload.post_survey:
        record.post_survey = json.dumps(payload.post_survey.model_dump(), ensure_ascii=False)
    if payload.decision_latency_ms is not None:
        record.decision_latency_ms = payload.decision_latency_ms

    record.updated_at = datetime.datetime.utcnow()
    db.commit()
    return ExperimentFeedbackResponse(success=True)


@router.get(
    "/allocation",
    response_model=PromptAllocationResponse,
    dependencies=[Depends(verify_admin_token)],
)
def get_prompt_allocation(
    db: Session = Depends(dependencies.get_db),
):
    config = _get_or_create_allocation_config(db)
    return _serialize_allocation(config)


@router.put(
    "/allocation",
    response_model=PromptAllocationResponse,
    dependencies=[Depends(verify_admin_token)],
)
def update_prompt_allocation(
    payload: PromptAllocationUpdateRequest,
    db: Session = Depends(dependencies.get_db),
):
    weights = payload.model_dump()
    total_weight = sum(weights.values())
    if total_weight <= 0:
        raise HTTPException(status_code=400, detail="At least one prompt group must have a weight above 0.")

    config = _get_or_create_allocation_config(db)
    config.empathy_weight = weights["empathy"]
    config.consequence_weight = weights["consequence"]
    config.normative_weight = weights["normative"]
    config.alternative_weight = weights["alternative"]
    config.control_weight = weights["control"]
    config.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(config)

    return _serialize_allocation(config)


@router.get("/dashboard", dependencies=[Depends(verify_admin_token)])
def get_dashboard_data(
    limit: int = Query(default=100, ge=1, le=500),
    group: str | None = Query(default=None),
    scenario_id: str | None = Query(default=None),
    db: Session = Depends(dependencies.get_db),
):
    filtered_query = _apply_filters(db.query(ExperimentRecord), scenario_id, group)

    total_records = filtered_query.count()
    completed_records = _apply_filters(db.query(ExperimentRecord), scenario_id, group).filter(
        ExperimentRecord.status == ExperimentStatusEnum.COMPLETED.value
    ).count()
    uncivil_triggered_records = _apply_filters(
        db.query(ExperimentRecord), scenario_id, group
    ).filter(ExperimentRecord.prompt_type.isnot(None)).count()

    group_distribution_rows = _apply_filters(
        db.query(ExperimentRecord.group, func.count(ExperimentRecord.id)), scenario_id, group
    ).group_by(ExperimentRecord.group).all()

    action_distribution_rows = _apply_filters(
        db.query(ExperimentRecord.final_action, func.count(ExperimentRecord.id)), scenario_id, group
    ).filter(ExperimentRecord.final_action.isnot(None)).group_by(ExperimentRecord.final_action).all()

    scenario_distribution_rows = _apply_filters(
        db.query(ExperimentRecord.scenario_id, func.count(ExperimentRecord.id)), scenario_id, group
    ).group_by(ExperimentRecord.scenario_id).all()

    filtered_rows = filtered_query.order_by(ExperimentRecord.id.desc()).all()
    latest_rows = filtered_rows[:limit]

    return {
        "summary": {
            "total_records": total_records,
            "completed_records": completed_records,
            "uncivil_triggered_records": uncivil_triggered_records,
        },
        "distributions": {
            "groups": {group_name: count for group_name, count in group_distribution_rows},
            "actions": {
                _serialize_action(action_name): count
                for action_name, count in action_distribution_rows
            },
            "scenarios": {scenario_name: count for scenario_name, count in scenario_distribution_rows},
        },
        "insights": _build_feedback_insights(filtered_rows),
        "allocation": _serialize_allocation(_get_or_create_allocation_config(db)),
        "records": [_serialize_record(row) for row in latest_rows],
    }
