import asyncio
import json
import logging
import re
import time

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)

LLM_SOURCE_LLM = "llm"
LLM_SOURCE_FALLBACK = "fallback"
LLM_SOURCE_MOCK = "mock"

# Expanded keyword list for deterministic keyword-trigger checks.
UNCIVIL_KEYWORDS = {
    "去你妈的",
    "脑子有病",
    "你妈死了",
    "脑残",
    "智障",
    "傻逼",
    "傻瓜",
    "白痴",
    "垃圾",
    "蠢",
    "滚",
    "废物",
}

REWRITE_REPLACEMENTS = {
    "去你妈的": "这个情况让我很不满",
    "你妈死了": "这件事让我很生气",
    "脑子有病": "这个做法不太合理",
    "脑残": "这个观点不够理性",
    "智障": "这个观点不够理性",
    "傻逼": "这种做法不太合适",
    "傻瓜": "这样做不太妥当",
    "白痴": "这样处理不够合适",
    "垃圾": "质量不太理想",
    "蠢": "不够妥当",
    "滚": "请你先冷静一下",
    "废物": "这种做法有待改进",
}

GENERIC_REMINDER_PATTERNS = (
    "请保持文明",
    "请文明交流",
    "文明交流",
    "理性表达",
    "尊重他人",
    "注意言辞",
    "避免不文明",
    "用尊重的语言",
    "保持礼貌",
)

RISK_RULES = (
    ("人身贬损", {"去你妈的", "脑子有病", "你妈死了", "脑残", "智障", "傻逼", "白痴", "废物", "垃圾"}),
    ("驱逐式表达", {"滚"}),
    ("标签化攻击", {"你这", "你个", "你就是", "这类人", "就这", "典型"}),
    ("阴阳怪气", {"呵呵", "笑死", "真有意思", "可真行", "真厉害"}),
    ("情绪宣泄", {"气死", "恶心", "离谱", "受不了", "烦死"}),
)

_LLM_SEMAPHORE = asyncio.Semaphore(max(1, settings.llm_max_concurrency))
_LLM_CONSECUTIVE_FAILURES = 0
_LLM_CIRCUIT_OPEN_UNTIL = 0.0


def _contains_uncivil_keyword(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in UNCIVIL_KEYWORDS)


def analyze_risk_features(text: str) -> list[str]:
    normalized = str(text or "").strip().lower()
    if not normalized:
        return []

    features = []
    for label, keywords in RISK_RULES:
        if any(keyword in normalized for keyword in keywords):
            features.append(label)

    if re.search(r"[!！]{2,}|[?？]{2,}", normalized) and "情绪升级" not in features:
        features.append("情绪升级")

    if not features and _contains_uncivil_keyword(normalized):
        features.append("潜在攻击性表达")

    return features[:4]


def _normalize_generated_text(text: str) -> str:
    cleaned = str(text or "").strip().strip('"').strip("'")
    cleaned = re.sub(r"^(改写后|润色后|建议|推荐文案)\s*[:：]\s*", "", cleaned)
    return cleaned.strip()


def _is_generic_guidance(text: str) -> bool:
    normalized = re.sub(r"\s+", "", text)
    if not normalized:
        return True

    if any(pattern in normalized for pattern in GENERIC_REMINDER_PATTERNS):
        return len(normalized) <= 60

    generic_exact = {
        "请保持文明交流，用尊重的语言表达观点。",
        "请保持文明交流。",
        "请理性表达观点。",
        "请尊重他人。",
    }
    return normalized in generic_exact


def _extract_rewritten_comment(content: str) -> str:
    parsed = _extract_json_object(content)
    if parsed:
        for key in ("rewritten_comment", "rewrite", "polished_comment", "comment", "text"):
            value = parsed.get(key)
            if isinstance(value, str) and value.strip():
                return _normalize_generated_text(value)
    return _normalize_generated_text(content)


def _validate_rewrite_or_fallback(rewritten: str, original_text: str) -> tuple[str, bool]:
    candidate = _normalize_generated_text(rewritten)
    if not candidate or len(candidate) < 6:
        return _fallback_rewrite(original_text), True
    if _contains_uncivil_keyword(candidate):
        return _fallback_rewrite(original_text), True
    if _is_generic_guidance(candidate):
        return _fallback_rewrite(original_text), True
    return candidate, False


def _fallback_rewrite(original_text: str) -> str:
    original = original_text.strip()
    if not original:
        return "我有不同看法，希望我们能理性沟通。"

    softened = original
    for source, target in REWRITE_REPLACEMENTS.items():
        softened = softened.replace(source, target)

    softened = re.sub(r"^(你个|你这|你真是个|你就是个|你这个)", "", softened)
    softened = softened.strip("，。！？!?、 ")

    if softened and softened != original:
        return f"我认为{softened}，希望我们理性讨论。"

    return f"我有不同看法：{original}。希望我们理性交流。"


def _mock_check_incivility(text: str) -> bool:
    return _contains_uncivil_keyword(text)


def _mock_generate_prompt(template: str, original_text: str) -> str:
    _ = template
    return _fallback_rewrite(original_text)


def _extract_json_object(text: str) -> dict | None:
    if not text:
        return None

    stripped = text.strip()
    try:
        parsed = json.loads(stripped)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", stripped)
    if not match:
        return None

    try:
        parsed = json.loads(match.group(0))
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        return None


def _is_circuit_open() -> bool:
    return time.monotonic() < _LLM_CIRCUIT_OPEN_UNTIL


def _mark_llm_success() -> None:
    global _LLM_CONSECUTIVE_FAILURES, _LLM_CIRCUIT_OPEN_UNTIL
    _LLM_CONSECUTIVE_FAILURES = 0
    _LLM_CIRCUIT_OPEN_UNTIL = 0.0


def _mark_llm_failure(exc: Exception) -> None:
    global _LLM_CONSECUTIVE_FAILURES, _LLM_CIRCUIT_OPEN_UNTIL
    if isinstance(exc, RuntimeError) and "circuit breaker is open" in str(exc):
        return

    _LLM_CONSECUTIVE_FAILURES += 1

    if _LLM_CONSECUTIVE_FAILURES >= settings.llm_failure_threshold:
        _LLM_CIRCUIT_OPEN_UNTIL = time.monotonic() + settings.llm_cooldown_seconds
        logger.warning(
            "LLM circuit opened for %ss after %s failures. Last error: %s",
            settings.llm_cooldown_seconds,
            _LLM_CONSECUTIVE_FAILURES,
            exc,
        )


async def _chat_completion(messages: list[dict], max_tokens: int = 128, temperature: float = 0.2) -> str:
    if _is_circuit_open():
        raise RuntimeError("LLM circuit breaker is open; skipped remote call.")

    payload = {
        "model": settings.aigc_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    timeout = httpx.Timeout(
        connect=settings.llm_connect_timeout_seconds,
        read=settings.llm_timeout_seconds,
        write=settings.llm_timeout_seconds,
        pool=settings.llm_connect_timeout_seconds,
    )
    limits = httpx.Limits(
        max_connections=max(8, settings.llm_max_concurrency * 2),
        max_keepalive_connections=max(4, settings.llm_max_concurrency),
    )

    async with _LLM_SEMAPHORE:
        for attempt in range(settings.llm_retries + 1):
            try:
                if _is_circuit_open():
                    raise RuntimeError("LLM circuit breaker is open; skipped remote call.")

                async with httpx.AsyncClient(timeout=timeout, limits=limits) as client:
                    response = await client.post(
                        settings.aigc_api_url,
                        headers={
                            "Authorization": f"Bearer {settings.aigc_api_key}",
                            "Content-Type": "application/json",
                        },
                        json=payload,
                    )
                    response.raise_for_status()
                    result = response.json()

                if isinstance(result, dict) and result.get("error"):
                    raise ValueError(f"LLM provider error: {result.get('error')}")

                choices = result.get("choices") if isinstance(result, dict) else None
                if not choices:
                    raise ValueError("LLM response has no choices")

                message = choices[0].get("message", {}) if isinstance(choices[0], dict) else {}
                content = message.get("content", "")
                if isinstance(content, list):
                    # Compatible with providers that return list-style content blocks.
                    content = "".join(
                        part.get("text", "") for part in content if isinstance(part, dict)
                    )

                content_text = str(content).strip()
                if not content_text:
                    raise ValueError("LLM response content is empty")

                _mark_llm_success()
                logger.info("LLM call succeeded. model=%s", settings.aigc_model)
                return content_text
            except Exception as exc:
                _mark_llm_failure(exc)
                logger.warning(
                    "LLM call failed (attempt %s/%s). model=%s, reason=%s",
                    attempt + 1,
                    settings.llm_retries + 1,
                    settings.aigc_model,
                    exc,
                )
                if attempt < settings.llm_retries:
                    await asyncio.sleep(0.3 * (attempt + 1))
                    continue
                raise


async def check_incivility(text: str) -> bool:
    # Deterministic guard: when explicit uncivil keywords are present,
    # force trigger even if model output is unstable.
    if _contains_uncivil_keyword(text):
        return True

    if settings.use_mock_llm:
        return _mock_check_incivility(text)

    try:
        content = await _chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是评论文明检测器。只输出 JSON，不要输出解释。"
                        "输出格式必须为：{\"is_uncivil\": true/false}。"
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "请判断下面评论是否包含辱骂、攻击、侮辱、人身贬损或明显不友善表达：\n"
                        f"{text}"
                    ),
                },
            ],
            max_tokens=64,
            temperature=0.0,
        )

        parsed = _extract_json_object(content)
        if parsed and "is_uncivil" in parsed:
            return bool(parsed["is_uncivil"])

        lowered = content.lower()
        if "true" in lowered:
            return True
        if "false" in lowered:
            return False
        return _mock_check_incivility(text)
    except Exception as exc:
        logger.warning("AIGC incivility check failed; falling back to keyword result. reason=%s", exc)
        return _mock_check_incivility(text)


async def generate_prompt(template: str, original_text: str) -> tuple[str, str]:
    if settings.use_mock_llm:
        return _mock_generate_prompt(template, original_text), LLM_SOURCE_MOCK

    try:
        content = await _chat_completion(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "你是社交平台评论润色助手。"
                        "请在保留原观点的前提下，删除辱骂和攻击措辞，改写成礼貌、可直接发布的中文评论。"
                        "只输出 JSON，格式必须为：{\"rewritten_comment\":\"...\"}。"
                        "rewritten_comment 必须是完整句子，不要输出提醒语，不要输出“请文明交流”这类泛提示。"
                        "不要复述规则，不要解释。字数控制在 80 字以内。"
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"干预风格要求：{template}\n"
                        f"用户原评论：{original_text}\n"
                        "任务：请输出针对这条评论的文明润色版。"
                    ),
                },
            ],
            max_tokens=120,
            temperature=0.3,
        )

        rewritten = _extract_rewritten_comment(content)
        validated, fallback_used = _validate_rewrite_or_fallback(rewritten, original_text)
        if fallback_used:
            logger.warning("LLM rewrite looked generic/invalid; fallback rewrite applied.")
            return validated, LLM_SOURCE_FALLBACK

        return validated, LLM_SOURCE_LLM
    except Exception as exc:
        logger.warning("AIGC prompt generation failed; fallback rewrite used. reason=%s", exc)
        return _mock_generate_prompt(template, original_text), LLM_SOURCE_FALLBACK
