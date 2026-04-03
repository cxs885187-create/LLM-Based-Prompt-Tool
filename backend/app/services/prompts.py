def get_prompt_template(group: str) -> str:
    templates = {
        "empathy": "Use an empathetic tone first, then gently restate the disagreement in a calmer and more respectful way.",
        "consequence": "Point out the possible impact of the expression, then guide the user toward a more rational and constructive comment.",
        "normative": "Highlight community norms and basic public-discussion etiquette without sounding preachy.",
        "alternative": "Keep the original stance, but rewrite it into a specific, discussable, non-attacking expression.",
        "control": "Use a neutral tone and only polish the wording for civility, without adding extra persuasion.",
    }
    return templates.get(group, templates["control"])
