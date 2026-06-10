"""Report API routes."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.db.session import get_db

router = APIRouter(tags=["reports"])


@router.post("/api/incidents/{incident_id}/report", response_model=schemas.ReportOut)
def generate_report_endpoint(incident_id: int, db: Session = Depends(get_db)):
    from app.agents.report_agent import generate_report
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident or not incident.alert:
        raise HTTPException(status_code=404, detail="事件未找到")

    # Collect data
    evidence = db.query(models.EvidenceItem).filter(models.EvidenceItem.incident_id == incident_id).all()
    actions = db.query(models.ResponseAction).filter(models.ResponseAction.incident_id == incident_id).all()
    chain_runs = db.query(models.AgentRun).filter(
        models.AgentRun.incident_id == incident_id,
        models.AgentRun.agent_name == "Attack Chain",
    ).first()

    content = generate_report(
        alert_title=incident.alert.title,
        parsed={},
        triage={"event_type": incident.event_type, "risk_level": incident.risk_level, "confidence": incident.confidence},
        evidence=[{"type": e.type, "title": e.title, "content": e.content, "source": e.source, "confidence": e.confidence} for e in evidence],
        attack_chain=chain_runs.output_data if chain_runs and chain_runs.output_data else {},
        actions=[{"action_type": a.action_type, "description": a.description, "risk": a.risk, "approval_required": a.approval_required, "status": a.status} for a in actions],
    )
    report = models.Report(incident_id=incident_id, content=content, format="markdown")
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/api/incidents/{incident_id}/report", response_model=schemas.ReportOut)
def get_report(incident_id: int, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.incident_id == incident_id).order_by(models.Report.created_at.desc()).first()
    if not report:
        raise HTTPException(status_code=404, detail="报告未找到")
    return report


@router.get("/api/reports/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.Report).filter(models.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return PlainTextResponse(content=report.content, media_type="text/markdown; charset=utf-8", headers={"Content-Disposition": f"attachment; filename=report-{report_id}.md"})
