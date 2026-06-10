"""事件 API 路由."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.agents.pipeline import analyze_incident
from app.db.session import get_db

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.post("", response_model=schemas.IncidentOut)
def create_incident(payload: schemas.IncidentCreate, db: Session = Depends(get_db)):
    incident = models.Incident(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("", response_model=List[schemas.IncidentOut])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(models.Incident).order_by(models.Incident.created_at.desc()).all()


@router.get("/{incident_id}", response_model=schemas.IncidentDetail)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="事件未找到")
    return incident


@router.post("/{incident_id}/analyze")
def start_analysis(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="事件未找到")
    if incident.status == "analyzing":
        raise HTTPException(status_code=400, detail="分析正在进行中")
    analyze_incident(db, incident_id)
    return {"ok": True, "status": incident.status}
