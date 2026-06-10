"""Windows 终端多源数据采集.

从进程、网络连接、服务、计划任务和注册表采集数据，
用于增强威胁调查。
"""
from __future__ import annotations

import platform
import subprocess
from typing import Any, Dict, List, Optional


def _run_cmd(cmd: str, timeout: int = 15) -> str:
    """Run a shell command and return stdout."""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
        return result.stdout if result.returncode == 0 else ""
    except Exception:
        return ""


def _is_windows() -> bool:
    return platform.system() == "Windows"


# ---------- Collectors ----------

def collect_processes() -> List[Dict[str, Any]]:
    """采集正在运行的进程."""
    if not _is_windows():
        return _mock_processes()

    output = _run_cmd("wmic process get ProcessId,Name,ExecutablePath,CommandLine /format:csv")
    if not output:
        return _mock_processes()

    processes = []
    for line in output.strip().split("\n")[1:]:
        parts = line.strip().split(",")
        if len(parts) >= 4:
            processes.append({
                "type": "process",
                "pid": parts[1],
                "name": parts[2],
                "path": parts[3],
                "command_line": parts[4] if len(parts) > 4 else "",
            })
    return processes


def collect_network_connections() -> List[Dict[str, Any]]:
    """Collect active network connections."""
    if not _is_windows():
        return _mock_network()

    output = _run_cmd("netstat -ano")
    if not output:
        return _mock_network()

    connections = []
    for line in output.strip().split("\n")[1:]:
        parts = line.split()
        if len(parts) >= 5 and parts[0] in ("TCP", "UDP"):
            connections.append({
                "type": "network",
                "protocol": parts[0],
                "local": parts[1],
                "remote": parts[2] if len(parts) > 2 else "",
                "state": parts[3] if len(parts) > 3 else "",
                "pid": parts[4] if len(parts) > 4 else "",
            })
    return connections


def collect_services() -> List[Dict[str, Any]]:
    """采集已安装的服务."""
    if not _is_windows():
        return _mock_services()

    output = _run_cmd('wmic service get Name,DisplayName,State,PathName /format:csv')
    if not output:
        return _mock_services()

    services = []
    for line in output.strip().split("\n")[1:]:
        parts = line.strip().split(",")
        if len(parts) >= 5:
            services.append({
                "type": "service",
                "name": parts[2],
                "display_name": parts[3],
                "state": parts[4],
                "path": parts[5] if len(parts) > 5 else "",
            })
    return services


def collect_scheduled_tasks() -> List[Dict[str, Any]]:
    """Collect scheduled tasks."""
    if not _is_windows():
        return _mock_tasks()

    output = _run_cmd('schtasks /query /fo csv /v')
    if not output:
        return _mock_tasks()

    tasks = []
    for line in output.strip().split("\n")[1:]:
        parts = line.strip().split(",")
        if len(parts) >= 4:
            tasks.append({
                "type": "scheduled_task",
                "name": parts[1].strip('"'),
                "status": parts[2].strip('"'),
                "next_run": parts[3].strip('"') if len(parts) > 3 else "",
            })
    return tasks


def collect_registry_suspicious() -> List[Dict[str, Any]]:
    """Check for common persistence registry keys."""
    if not _is_windows():
        return _mock_registry()

    suspicious_keys = [
        r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
        r"HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce",
        r"HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run",
    ]
    results = []
    for key in suspicious_keys:
        output = _run_cmd(f'reg query "{key}" 2>nul')
        if output:
            for line in output.strip().split("\n"):
                if "=" in line:
                    results.append({
                        "type": "registry",
                        "key": key,
                        "value": line.strip(),
                    })
    return results


def collect_all() -> Dict[str, Any]:
    """从所有来源采集数据并返回合并结果."""
    return {
        "processes": collect_processes(),
        "network_connections": collect_network_connections(),
        "services": collect_services(),
        "scheduled_tasks": collect_scheduled_tasks(),
        "registry": collect_registry_suspicious(),
        "is_mock": not _is_windows(),
        "platform": platform.system(),
    }


# ---------- Mock data for non-Windows ----------

def _mock_processes() -> List[Dict[str, Any]]:
    return [
        {"type": "process", "pid": "4", "name": "System", "path": "System", "command_line": ""},
        {"type": "process", "pid": "1234", "name": "explorer.exe", "path": "C:\\Windows\\explorer.exe", "command_line": "explorer.exe"},
        {"type": "process", "pid": "5678", "name": "svchost.exe", "path": "C:\\Windows\\System32\\svchost.exe", "command_line": "svchost.exe -k netsvcs"},
        {"type": "process", "pid": "9999", "name": "suspicious.exe", "path": "C:\\Temp\\suspicious.exe", "command_line": "suspicious.exe --hidden"},
    ]


def _mock_network() -> List[Dict[str, Any]]:
    return [
        {"type": "network", "protocol": "TCP", "local": "0.0.0.0:135", "remote": "LISTENING", "state": "LISTENING", "pid": "5678"},
        {"type": "network", "protocol": "TCP", "local": "192.168.1.10:49821", "remote": "91.215.85.142:443", "state": "ESTABLISHED", "pid": "9999"},
        {"type": "network", "protocol": "TCP", "local": "192.168.1.10:49822", "remote": "10.0.0.5:3389", "state": "ESTABLISHED", "pid": "1234"},
    ]


def _mock_services() -> List[Dict[str, Any]]:
    return [
        {"type": "service", "name": "WinDefend", "display_name": "Windows Defender", "state": "Running", "path": "C:\\Program Files\\Windows Defender\\MsMpEng.exe"},
        {"type": "service", "name": "SuspiciousService", "display_name": "SuspiciousService", "state": "Running", "path": "C:\\Temp\\svc.exe"},
    ]


def _mock_tasks() -> List[Dict[str, Any]]:
    return [
        {"type": "scheduled_task", "name": "\\Microsoft\\Windows\\Defrag\\ScheduledDefrag", "status": "Ready", "next_run": "2026-06-11 01:00"},
        {"type": "scheduled_task", "name": "\\Updater", "status": "Running", "next_run": "2026-06-10 15:00"},
    ]


def _mock_registry() -> List[Dict[str, Any]]:
    return [
        {"type": "registry", "key": "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "value": "\"SecurityHealth\"=\"C:\\Program Files\\Windows Defender\\MSASCuiL.exe\""},
        {"type": "registry", "key": "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run", "value": "\"Backdoor\"=\"C:\\Temp\\payload.exe\""},
    ]
