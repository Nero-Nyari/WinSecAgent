"""响应动作 API 路由 - 扩展真实执行支持."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.db.session import get_db
from app.services.action_executor import ActionExecutor

router = APIRouter(prefix="/api/incidents", tags=["actions"])

_executor = ActionExecutor(dry_run=True)


@router.get("/{incident_id}/actions", response_model=List[schemas.ResponseActionOut])
def list_actions(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(models.Incident).filter(models.Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return db.query(models.ResponseAction).filter(models.ResponseAction.incident_id == incident_id).all()


@router.post("/{incident_id}/actions/{action_id}/approve")
def approve_action(incident_id: int, action_id: int, payload: schemas.ActionApproval, db: Session = Depends(get_db)):
    action = db.query(models.ResponseAction).filter(
        models.ResponseAction.id == action_id,
        models.ResponseAction.incident_id == incident_id,
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="动作未找到")
    action.status = "approved"
    action.approved_by = payload.approved_by
    db.commit()
    return {"ok": True, "status": action.status}


@router.post("/{incident_id}/actions/{action_id}/reject")
def reject_action(incident_id: int, action_id: int, payload: schemas.ActionApproval, db: Session = Depends(get_db)):
    action = db.query(models.ResponseAction).filter(
        models.ResponseAction.id == action_id,
        models.ResponseAction.incident_id == incident_id,
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="动作未找到")
    action.status = "rejected"
    action.approved_by = payload.approved_by
    db.commit()
    return {"ok": True, "status": action.status}


@router.post("/{incident_id}/actions/{action_id}/simulate")
def simulate_action(incident_id: int, action_id: int, db: Session = Depends(get_db)):
    action = db.query(models.ResponseAction).filter(
        models.ResponseAction.id == action_id,
        models.ResponseAction.incident_id == incident_id,
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="动作未找到")
    action.status = "simulated"
    db.commit()
    return {"ok": True, "status": action.status, "message": f"已模拟: {action.action_type}"}


@router.post("/{incident_id}/actions/{action_id}/execute")
def execute_action(incident_id: int, action_id: int, db: Session = Depends(get_db)):
    """Execute an approved action for real (or dry-run)."""
    action = db.query(models.ResponseAction).filter(
        models.ResponseAction.id == action_id,
        models.ResponseAction.incident_id == incident_id,
    ).first()
    if not action:
        raise HTTPException(status_code=404, detail="动作未找到")

    result = _executor.execute(
        action_type=action.action_type,
        description=action.description,
    )
    action.result = result
    action.status = "executed" if result.get("success") else "failed"
    db.commit()
    return {"ok": result.get("success", False), "result": result}


@router.post("/actions/execute-direct")
def execute_direct(payload: schemas.ActionExecuteRequest):
    """直接执行动作（不关联事件）."""
    result = _executor.execute(
        action_type=payload.action_type,
        description=payload.description,
        params=payload.params,
    )
    return result


@router.get("/actions/executor-status")
def executor_status():
    """获取动作执行器配置."""
    return {
        "dry_run": _executor.dry_run,
        "is_windows": _executor.is_windows,
        "quarantine_dir": str(_executor.quarantine_dir),
    }


@router.post("/actions/set-dry-run")
def set_dry_run(dry_run: bool = True):
    """切换执行器的模拟模式."""
    _executor.dry_run = dry_run
    return {"dry_run": _executor.dry_run}
