import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api import dependencies
from app.core.security import limiter
from app.db.session import SessionLocal
from app.models.record import ExperimentRecord, ExperimentStatusEnum
from app.schemas.dto import (
    CommentActionRequest,
    CommentActionResponse,
    CommentCheckRequest,
    CommentCheckResponse,
)
from app.services.llm_client import check_incivility, generate_prompt
from app.services.prompts import get_prompt_template


router = APIRouter()


@router.post("/check", response_model=CommentCheckResponse)
@limiter.limit("5/minute")
async def check_comment(
    request: Request,
    payload: CommentCheckRequest,
    db: Session = Depends(dependencies.get_db),
):
    record = db.query(ExperimentRecord).filter(
        ExperimentRecord.experiment_id == payload.experiment_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment record not found.")

    if record.status != ExperimentStatusEnum.INITIALIZED.value:
        raise HTTPException(
            status_code=400,
            detail="实验状态无效：请先调用 /init，且同一个 experiment_id 只能调用一次 /check。",
        )

    # Capture immutable fields and release this session before awaiting remote LLM calls.
    assigned_group = record.group
    db.close()

    is_uncivil = await check_incivility(payload.comment_text)

    prompt_text = None
    prompt_type = None
    prompt_source = None
    if is_uncivil:
        template = get_prompt_template(assigned_group)
        prompt_text, prompt_source = await generate_prompt(template, payload.comment_text)
        prompt_type = assigned_group

    write_db = SessionLocal()
    try:
        writable_record = write_db.query(ExperimentRecord).filter(
            ExperimentRecord.experiment_id == payload.experiment_id
        ).first()
        if not writable_record:
            raise HTTPException(status_code=404, detail="Experiment record not found.")

        if writable_record.status != ExperimentStatusEnum.INITIALIZED.value:
            raise HTTPException(
                status_code=400,
                detail="实验状态无效：请先调用 /init，且同一个 experiment_id 只能调用一次 /check。",
            )

        writable_record.original_comment = payload.comment_text
        writable_record.prompt_type = prompt_type
        writable_record.generated_prompt = prompt_text
        writable_record.status = ExperimentStatusEnum.CHECKED.value
        writable_record.updated_at = datetime.datetime.utcnow()
        write_db.commit()
    finally:
        write_db.close()

    return CommentCheckResponse(
        is_uncivil=is_uncivil,
        prompt_text=prompt_text,
        prompt_type=prompt_type,
        prompt_source=prompt_source,
    )


@router.post("/action", response_model=CommentActionResponse)
def record_action(
    request: CommentActionRequest,
    db: Session = Depends(dependencies.get_db),
):
    record = db.query(ExperimentRecord).filter(
        ExperimentRecord.experiment_id == request.experiment_id
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Experiment record not found.")

    if record.status != ExperimentStatusEnum.CHECKED.value:
        raise HTTPException(
            status_code=400,
            detail="实验状态无效：请先完成 /check，再调用 /action。",
        )

    if request.action == "modify" and not request.modified_comment:
        raise HTTPException(
            status_code=400,
            detail="modified_comment is required when action is 'modify'.",
        )

    record.final_action = request.action
    record.modified_comment = request.modified_comment if request.action == "modify" else None
    record.status = ExperimentStatusEnum.COMPLETED.value
    record.updated_at = datetime.datetime.utcnow()
    db.commit()

    return CommentActionResponse(success=True)
