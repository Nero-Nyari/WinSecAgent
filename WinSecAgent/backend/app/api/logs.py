"""Windows 日志读取 API 路由."""
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.db.session import get_db
from app.services.log_reader import read_windows_logs
from app.agents.pipeline import analyze_incident

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.post("/read", response_model=schemas.LogReadResponse)
def read_logs(payload: schemas.LogReadRequest):
    """读取 Windows 事件日志（真实数据或模拟数据）."""
    result = read_windows_logs(
        channels=payload.channels,
        suspicious_only=payload.suspicious_only,
        max_events=payload.max_events,
    )
    return result


@router.post("/import")
def import_to_alerts(
    payload: schemas.LogReadRequest,
    db: Session = Depends(get_db),
):
    """读取日志并自动为可疑事件创建告警."""
    result = read_windows_logs(
        channels=payload.channels,
        suspicious_only=payload.suspicious_only,
        max_events=payload.max_events,
    )
    created = 0
    for evt in result["events"]:
        alert = models.Alert(
            title=f"EventID {evt.get('EventID')} - {evt.get('Channel', 'Unknown')}",
            raw_content=evt.get("Message", ""),
            source_type="windows_log",
            severity=_event_to_severity(evt.get("EventID", 0)),
            status="pending",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        incident = models.Incident(alert_id=alert.id, status="pending")
        db.add(incident)
        db.commit()
        created += 1

    return {
        "ok": True,
        "alerts_created": created,
        "total_events": result["total_filtered"],
        "is_mock": result["is_mock"],
    }


@router.post("/import-and-analyze")
def import_and_analyze(
    payload: schemas.LogReadRequest,
    db: Session = Depends(get_db),
):
    """读取日志、创建告警并自动分析每个事件."""
    result = read_windows_logs(
        channels=payload.channels,
        suspicious_only=payload.suspicious_only,
        max_events=payload.max_events,
    )
    created = 0
    analyzed = 0
    for evt in result["events"]:
        alert = models.Alert(
            title=f"EventID {evt.get('EventID')} - {evt.get('Channel', 'Unknown')}",
            raw_content=evt.get("Message", ""),
            source_type="windows_log",
            severity=_event_to_severity(evt.get("EventID", 0)),
            status="pending",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        incident = models.Incident(alert_id=alert.id, status="pending")
        db.add(incident)
        db.commit()
        db.refresh(incident)
        created += 1

        try:
            analyze_incident(db, incident.id)
            analyzed += 1
        except Exception:
            pass

    return {
        "ok": True,
        "alerts_created": created,
        "incidents_analyzed": analyzed,
        "is_mock": result["is_mock"],
    }


def _event_to_severity(event_id: int) -> str:
    """将 Windows 事件ID映射到风险等级."""
    critical_ids = {1116, 1117, 4697}
    high_ids = {4625, 4740, 7045}
    medium_ids = {4648, 4720, 4722, 4726, 4732}

    if event_id in critical_ids:
        return "critical"
    elif event_id in high_ids:
        return "high"
    elif event_id in medium_ids:
        return "medium"
    return "low"
