"""Report Agent: Generate security incident report."""
from typing import Any, Dict, List

from app.core.llm_provider import get_llm_provider

SYSTEM_PROMPT = """你是一名安全报告撰写专家。请根据以下安全事件信息，生成一份专业的安全事件分析报告（Markdown 格式）。报告应包含：
1. 事件摘要
2. 影响范围
3. 攻击链分析
4. 证据清单
5. 处置建议
6. 复盘建议
请用中文撰写，格式清晰。"""


def generate_report(
    alert_title: str,
    parsed: Dict[str, Any],
    triage: Dict[str, Any],
    evidence: List[Dict[str, Any]],
    attack_chain: Dict[str, Any],
    actions: List[Dict[str, Any]],
) -> str:
    llm = get_llm_provider()
    evidence_md = "\n".join([f"- **{e['title']}** ({e['type']}, 置信度 {e.get('confidence', 0)}): {e['content']}" for e in evidence])
    actions_md = "\n".join([f"- **{a['action_type']}** (风险: {a['risk']}, 需审批: {'是' if a['approval_required'] else '否'}): {a['description']}" for a in actions])
    prompt = f"""事件标题: {alert_title}
解析结果:
{parsed}

研判结果:
{triage}

攻击链:
{attack_chain}

证据:
{evidence_md}

处置建议:
{actions_md}

请生成完整报告。"""
    try:
        print(f"[Report] 使用 LLM 类型: {type(llm).__name__}")
        result = llm.generate(prompt, system=SYSTEM_PROMPT, max_tokens=3000)
        print(f"[Report] LLM 生成成功，长度: {len(result)}")
        return result
    except Exception as e:
        print(f"[Report] LLM 生成失败: {e}")
        import traceback
        traceback.print_exc()
        return _fallback_report(alert_title, parsed, triage, evidence, attack_chain, actions)


def _fallback_report(
    alert_title: str,
    parsed: Dict[str, Any],
    triage: Dict[str, Any],
    evidence: List[Dict[str, Any]],
    attack_chain: Dict[str, Any],
    actions: List[Dict[str, Any]],
) -> str:
    lines = [
        f"# 安全事件分析报告: {alert_title}",
        "",
        "## 1. 事件摘要",
        f"- 事件类型: {triage.get('event_type', '未知')}",
        f"- 风险等级: {triage.get('risk_level', '未知')}",
        f"- 置信度: {triage.get('confidence', 0)}",
        f"- 源 IP: {parsed.get('source_ip', '未知')}",
        f"- 目标 IP: {parsed.get('target_ip', '未知')}",
        "",
        "## 2. 影响范围",
        "本次事件影响目标主机及相关账号，具体范围待进一步排查。",
        "",
        "## 3. 攻击链分析",
        f"攻击路径: {attack_chain.get('attack_path', '未知')}",
        "",
        "## 4. 证据清单",
    ]
    for e in evidence:
        lines.append(f"- {e['title']}: {e['content']}")
    lines.extend(["", "## 5. 处置建议"])
    for a in actions:
        lines.append(f"- {a['action_type']}: {a['description']}")
    lines.extend(["", "## 6. 复盘建议", "- 加强边界防护和日志监控", "- 定期更新威胁情报和漏洞库", "- 完善应急响应流程"])
    return "\n".join(lines)
