def get_prompt_template(group: str) -> str:
    templates = {
        "empathy": "共情风格：先表达理解，再平和地陈述不同观点。",
        "consequence": "后果风格：点明该行为造成的影响，再提出理性诉求。",
        "normative": "规范风格：强调规则意识和公共讨论中的基本礼貌。",
        "alternative": "替代表达风格：保留态度强度，但改成具体、可讨论的措辞。",
        "control": "中性风格：不增加额外说教，仅做礼貌化改写。",
    }
    return templates.get(group, templates["control"])
