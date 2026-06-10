"""Windows 事件日志读取器.

通过 pywin32 读取本地 Windows 事件日志中的安全/系统/应用/Defender 日志。
在非 Windows 平台或 pywin32 不可用时，回退到合成演示数据。
"""
from __future__ import annotations

import json
import platform
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

# ---------- suspicious event IDs ----------
SUSPICIOUS_IDS = {
    4625,  # failed logon
    4648,  # explicit credentials logon
    4740,  # account locked out
    4720,  # user account created
    4722,  # user account enabled
    4724,  # password reset attempt
    4726,  # user account deleted
    4732,  # member added to local group
    7045,  # new service installed
    1116,  # Defender malware detected
    1117,  # Defender malware action
    4697,  # service installed in security log
    5156,  # Windows Filtering Platform connection
}

CHANNELS = ["Security", "System", "Application"]

# ---------- Mock data generation ----------

_MOCK_TEMPLATES: List[Dict[str, Any]] = [
    {"EventID": 4625, "Level": 2, "Channel": "Security",
     "Message": "账户登录失败。\n主体: security agent\n目标账户: admin\n源网络地址: 192.168.1.105\n失败原因: 用户名未知或密码错误。"},
    {"EventID": 4625, "Level": 2, "Channel": "Security",
     "Message": "账户登录失败。\n主体: security agent\n目标账户: administrator\n源网络地址: 10.0.0.22\n失败原因: 账户锁定。"},
    {"EventID": 4648, "Level": 3, "Channel": "Security",
     "Message": "使用显式凭据尝试登录。\n主体: WIN10-PC\\user1\n目标服务器: LOCALHOST\n使用了新凭据。"},
    {"EventID": 4740, "Level": 2, "Channel": "Security",
     "Message": "用户账户被锁定。\n目标账户: administrator\n调用计算机名: WIN10-PC"},
    {"EventID": 7045, "Level": 3, "Channel": "System",
     "Message": "系统中安装了新服务。\n服务名: SuspiciousService\n服务类型: 用户模式服务\n启动类型: 自动启动\n服务路径: C:\\Temp\\svc.exe"},
    {"EventID": 1116, "Level": 2, "Channel": "Microsoft-Windows-Windows Defender/Operational",
     "Message": "Windows Defender 检测到恶意软件。\n检测名称: Trojan:Win32/Emotet\n资源: C:\\Users\\Public\\payload.exe\n操作: 失败"},
    {"EventID": 1117, "Level": 2, "Channel": "Microsoft-Windows-Windows Defender/Operational",
     "Message": "Windows Defender 已采取操作保护系统免受恶意软件侵害。\n检测名称: Ransom:Win32/WannaCry\n资源: D:\\data\\file.doc\n操作: 已隔离"},
    {"EventID": 4720, "Level": 4, "Channel": "Security",
     "Message": "创建了新用户账户。\n新账户名: backdoor_admin\n新账户域: WIN10-PC"},
    {"EventID": 4697, "Level": 3, "Channel": "Security",
     "Message": "系统中安装了服务。\n服务名: StealthService\n服务文件名: C:\\Windows\\Temp\\stealth.exe"},
]


def _generate_mock_events(count: int = 25) -> List[Dict[str, Any]]:
    """生成合成 Windows 事件用于演示 / 非 Windows 环境."""
    events = []
    now = datetime.now()
    for i in range(count):
        tpl = random.choice(_MOCK_TEMPLATES)
        event = dict(tpl)
        event["TimeCreated"] = (now - timedelta(minutes=random.randint(1, 1440))).strftime("%Y-%m-%d %H:%M:%S")
        event["RecordId"] = 100000 + i
        event["ProviderName"] = "Microsoft-Windows-Security-Auditing"
        events.append(event)
    events.sort(key=lambda e: e["TimeCreated"], reverse=True)
    return events


def _filter_suspicious(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """仅保留 EventID 在 SUSPICIOUS_IDS 中的事件."""
    return [e for e in events if e.get("EventID") in SUSPICIOUS_IDS]


# ---------- Real Windows reading ----------

def _read_real_logs(channels: Optional[List[str]] = None, max_events: int = 200) -> List[Dict[str, Any]]:
    """Read real Windows Event Log via pywin32."""
    try:
        import win32evtlog  # type: ignore
        import win32evtlogutil  # type: ignore
    except ImportError:
        return _generate_mock_events(max_events)

    channels = channels or CHANNELS
    all_events: List[Dict[str, Any]] = []

    for channel in channels:
        try:
            hand = win32evtlog.OpenEventLog(None, channel)
            flags = win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            total = 0
            while total < max_events:
                batch = win32evtlog.ReadEventLog(hand, flags, 0)
                if not batch:
                    break
                for evt in batch:
                    if total >= max_events:
                        break
                    event_dict = {
                        "TimeCreated": evt.TimeGenerated.Format("%Y-%m-%d %H:%M:%S"),
                        "EventID": evt.EventID & 0xFFFF,
                        "Level": evt.EventType,
                        "Channel": channel,
                        "ProviderName": evt.SourceName,
                        "RecordId": evt.RecordNumber,
                        "Message": win32evtlogutil.SafeFormatMessage(evt, channel) if evt.StringInserts else "",
                    }
                    all_events.append(event_dict)
                    total += 1
            win32evtlog.CloseEventLog(hand)
        except Exception:
            continue

    return all_events


# ---------- Public API ----------

def read_windows_logs(
    channels: Optional[List[str]] = None,
    suspicious_only: bool = True,
    max_events: int = 200,
) -> Dict[str, Any]:
    """Read Windows logs and return structured result.

    Returns dict with keys: events, stats, timestamp, is_mock.
    """
    is_windows = platform.system() == "Windows"

    if is_windows:
        raw_events = _read_real_logs(channels, max_events)
        is_mock = False
    else:
        raw_events = _generate_mock_events(max_events)
        is_mock = True

    if suspicious_only:
        events = _filter_suspicious(raw_events)
    else:
        events = raw_events

    # Build stats
    id_counts: Dict[int, int] = {}
    channel_counts: Dict[str, int] = {}
    for e in events:
        eid = e.get("EventID", 0)
        id_counts[eid] = id_counts.get(eid, 0) + 1
        ch = e.get("Channel", "Unknown")
        channel_counts[ch] = channel_counts.get(ch, 0) + 1

    return {
        "events": events,
        "total_raw": len(raw_events),
        "total_filtered": len(events),
        "event_id_stats": id_counts,
        "channel_stats": channel_counts,
        "timestamp": datetime.now().isoformat(),
        "is_mock": is_mock,
        "platform": platform.system(),
    }


def format_events_for_llm(events: List[Dict[str, Any]], max_events: int = 30) -> str:
    """将事件格式化为适合 LLM 提示的文本块."""
    lines = []
    for e in events[:max_events]:
        lines.append(
            f"[{e.get('TimeCreated', '?')}] EventID={e.get('EventID')} "
            f"Channel={e.get('Channel', '?')} Level={e.get('Level', '?')}\n"
            f"  {e.get('Message', '')[:300]}"
        )
    return "\n\n".join(lines)
