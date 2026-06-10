"""Response Agent: Generate response actions."""
import json
import re
from typing import Any, Dict, List

from app.agents.context import looks_like_internal_debug_log
from app.core.llm_provider import get_llm_provider

SYSTEM_PROMPT = """你是一名安全处置专家。请根据事件信息和攻击链，生成处置建议，并以 JSON 格式输出：
{
  "actions": [
    {
      "action_type": "动作类型",
      "description": "详细描述",
      "risk": "风险等级 (low/medium/high)",
      "approval_required": true/false,
      "verification": "验证步骤",
      "rollback": "回滚建议"
    }
  ]
}
只输出 JSON，不要任何解释。"""


def generate_actions(parsed: Dict[str, Any], raw_content: str, attack_chain: Dict[str, Any]) -> List[Dict[str, Any]]:
    if looks_like_internal_debug_log(parsed, raw_content):
        return _benign_internal_debug_actions()

    llm = get_llm_provider()
    chain_text = json.dumps(attack_chain, ensure_ascii=False, indent=2)
    prompt = f"原始告警：\n{raw_content}\n\n攻击链：\n{chain_text}\n\n请生成处置建议。"
    try:
        raw = llm.generate(prompt, system=SYSTEM_PROMPT, max_tokens=1200)
        match = re.search(r"```json\s*(.*?)\s*```", raw, re.DOTALL)
        if match:
            raw = match.group(1)
        data = json.loads(raw)
        actions = data.get("actions", [])
        for a in actions:
            a.setdefault("risk", "medium")
            a.setdefault("approval_required", a.get("risk") == "high")
            a.setdefault("status", "pending")
        return actions
    except Exception:
        return _fallback_actions(parsed, raw_content)


def _fallback_actions(parsed: Dict[str, Any], raw_content: str) -> List[Dict[str, Any]]:
    if looks_like_internal_debug_log(parsed, raw_content):
        return _benign_internal_debug_actions()

    text = raw_content.lower()
    actions = []
    if any(k in text for k in ("brute force", "爆破")):
        actions.append({
            "action_type": "封禁源IP",
            "description": f"在防火墙封禁源 IP {parsed.get('source_ip', '未知')}",
            "risk": "low",
            "approval_required": False,
            "verification": "检查防火墙规则是否生效",
            "rollback": "删除对应防火墙规则",
            "status": "pending",
        })
        actions.append({
            "action_type": "重置账号密码",
            "description": f"强制重置账号 {parsed.get('username', '未知')} 密码",
            "risk": "medium",
            "approval_required": True,
            "verification": "确认账号无法再用旧密码登录",
            "rollback": "通过管理员恢复旧密码（不推荐）",
            "status": "pending",
        })
    if any(k in text for k in ("sql injection", "log4j", "rce")):
        actions.append({
            "action_type": "隔离目标主机",
            "description": f"将 {parsed.get('target_ip', '未知')} 从生产网隔离到安全区",
            "risk": "high",
            "approval_required": True,
            "verification": "确认主机无法访问业务网段",
            "rollback": "恢复网络 ACL",
            "status": "pending",
        })
        actions.append({
            "action_type": "打补丁/升级",
            "description": "升级 WAF 规则或应用补丁",
            "risk": "medium",
            "approval_required": True,
            "verification": "复测漏洞是否修复",
            "rollback": "回滚到上一个版本镜像",
            "status": "pending",
        })
    if any(k in text for k in ("miner", "cryptominer")):
        actions.append({
            "action_type": "终止恶意进程",
            "description": "kill -9 恶意进程并删除文件",
            "risk": "medium",
            "approval_required": True,
            "verification": "CPU 使用率恢复正常",
            "rollback": "无法回滚，建议提前备份",
            "status": "pending",
        })
    if not actions:
        actions.append({
            "action_type": "持续观察",
            "description": "增加日志监控频率，观察 24 小时",
            "risk": "low",
            "approval_required": False,
            "verification": "复查日志无新增异常",
            "rollback": "无需回滚",
            "status": "pending",
        })
    return actions


def _benign_internal_debug_actions() -> List[Dict[str, Any]]:
    return [
        {
            "action_type": "标记为误报",
            "description": "将事件关闭为正常的内部应用/数据库调试日志。",
            "risk": "low",
            "approval_required": False,
            "verification": "确认来源服务和影响字段表明无外部请求。",
            "rollback": "如果有额外的外部请求或载荷证据出现，重新打开事件。",
            "status": "pending",
        },
        {
            "action_type": "审查调试日志策略",
            "description": "如果不需要，减少应用调试模式中的敏感 SQL 查询日志记录。",
            "risk": "low",
            "approval_required": False,
            "verification": "检查报告服务的应用日志配置。",
            "rollback": "如果故障排查需要，恢复之前的日志级别。",
            "status": "pending",
        },
    ]
