"""告警 API 路由."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.cases.demo_cases import DEMO_CASES
from app.db.session import get_db

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.post("", response_model=schemas.AlertOut)
def create_alert(payload: schemas.AlertCreate, db: Session = Depends(get_db)):
    alert = models.Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("", response_model=List[schemas.AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(models.Alert.created_at.desc()).all()


@router.get("/{alert_id}", response_model=schemas.AlertOut)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="告警未找到")
    return alert


@router.delete("/{alert_id}")
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="告警未找到")
    db.delete(alert)
    db.commit()
    return {"ok": True}


@router.post("/from-case/{case_id}", response_model=schemas.AlertOut)
def create_from_case(case_id: str, db: Session = Depends(get_db)):
    for case in DEMO_CASES:
        if case["id"] == case_id:
            alert = models.Alert(
                title=case["title"],
                raw_content=case["raw_content"],
                source_type="demo_case",
                severity=case["severity"],
                status="pending",
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            return alert
    raise HTTPException(status_code=404, detail="演示案例未找到")
