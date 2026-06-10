"""Parser Agent: Extract structured fields from raw alert."""
import json
import re
from typing import Any, Dict

from app.core.llm_provider import get_llm_provider

SYSTEM_PROMPT = """你是一名安全告警解析专家。请从原始告警文本中提取以下结构化字段，并以 JSON 格式输出：
{
  "title": "事件标题",
  "source_ip": "源IP",
  "target_ip": "目标IP",
  "target_port": "目标端口",
  "username": "涉及用户名",
  "timestamp": "时间",
  "alert_type": "告警类型",
  "rule_name": "命中规则",
  "evidence_snippet": "原始证据片段"
}
如果某个字段无法提取，使用 null。只输出 JSON，不要任何解释。"""


def parse_alert(raw_content: str) -> Dict[str, Any]:
    llm = get_llm_provider()
    prompt = f"原始告警内容：\n{raw_content}\n\n请提取结构化字段。"
    try:
        raw = llm.generate(prompt, system=SYSTEM_PROMPT, max_tokens=1024)
        # Extract JSON from markdown code block if present
        match = re.search(r"```json\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            raw = match.group(1)
        return json.loads(raw)
    except Exception:
        # Fallback extraction
        return _fallback_parse(raw_content)


def _fallback_parse(raw_content: str) -> Dict[str, Any]:
    import re
    ips = re.findall(r"\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b", raw_content)
    source_ip = ips[0] if len(ips) > 0 else None
    target_ip = ips[1] if len(ips) > 1 else None
    port_match = re.search(r":(\d{2,5})\b", raw_content)
    port = int(port_match.group(1)) if port_match else None
    user_match = re.search(r"(?:user|username|账户|用户)[：:]\s*(\S+)", raw_content, re.I)
    username = user_match.group(1) if user_match else None
    time_match = re.search(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?)", raw_content)
    timestamp = time_match.group(1) if time_match else None
    return {
        "title": raw_content.split("\n")[0][:80] if raw_content else "未知告警",
        "source_ip": source_ip,
        "target_ip": target_ip,
        "target_port": port,
        "username": username,
        "timestamp": timestamp,
        "alert_type": None,
        "rule_name": None,
        "evidence_snippet": raw_content[:500],
    }
