from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.api.schemas import (
    LoginRequest,
    TokenResponse,
    DashboardResponse,
    MetricIngestRequest,
    HospitalOut,
)
from app.core.database import get_db
from app.models.entities import Alert, AlertRecipient, Hospital, Patient, UserHospital
from app.services.auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_primary_hospital_id,
    resolve_hospital_id,
)
from app.services.dashboard import get_dashboard
from app.services.metrics import ingest_metric

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email)
    hospital_id = get_primary_hospital_id(db, user.user_id)
    token = create_access_token({
        "sub": str(user.user_id),
        "hospital_id": str(hospital_id),
        "role": user.role,
    })
    return TokenResponse(access_token=token)


@router.get("/hospitals", response_model=List[HospitalOut])
def hospitals(db: Session = Depends(get_db), user=Depends(get_current_user)):
    hospitals = (
        db.query(Hospital)
        .join(UserHospital, UserHospital.hospital_id == Hospital.hospital_id)
        .filter(UserHospital.user_id == user.user_id)
        .order_by(Hospital.name.asc())
        .all()
    )
    return hospitals


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    request: Request,
    patients_limit: int = 20,
    patients_offset: int = 0,
    alerts_limit: int = 20,
    alerts_offset: int = 0,
    hours: int = 24,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    hospital_id = resolve_hospital_id(request, user, db)
    data = get_dashboard(
        db,
        hospital_id,
        patients_limit,
        patients_offset,
        alerts_limit,
        alerts_offset,
        hours,
    )
    return data


@router.get("/patients")
def patients(
    request: Request,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    hospital_id = resolve_hospital_id(request, user, db)
    query = db.query(Patient).filter(Patient.hospital_id == hospital_id)
    if status:
        query = query.filter(Patient.current_status == status)
    total = query.count()
    patients = query.order_by(Patient.created_at.desc()).limit(limit).offset(offset).all()
    return {"items": patients, "page": {"total": total, "limit": limit, "offset": offset}}


@router.get("/patients/{patient_id}")
def patient_detail(
    request: Request,
    patient_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    hospital_id = resolve_hospital_id(request, user, db)
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id, Patient.hospital_id == hospital_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/alerts/{alert_id}/ack")
def acknowledge_alert(
    request: Request,
    alert_id: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    hospital_id = resolve_hospital_id(request, user, db)
    alert = (
        db.query(Alert)
        .join(Patient, Alert.patient_id == Patient.patient_id)
        .filter(Alert.alert_id == alert_id, Patient.hospital_id == hospital_id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.is_acknowledged = True
    recipient = (
        db.query(AlertRecipient)
        .filter(
            AlertRecipient.alert_id == alert.alert_id,
            AlertRecipient.user_id == user.user_id,
        )
        .first()
    )
    if recipient and recipient.acknowledged_at is None:
        recipient.acknowledged_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(alert)
    return {"alert_id": str(alert.alert_id), "is_acknowledged": alert.is_acknowledged}


@router.post("/ingest/metrics")
def ingest(
    request: Request,
    payload: MetricIngestRequest,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    hospital_id = resolve_hospital_id(request, user, db)
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == payload.patient_id, Patient.hospital_id == hospital_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    measured_at = payload.measured_at or datetime.now(timezone.utc)
    metric = ingest_metric(db, patient, payload.metric_type, payload.metric_value, measured_at)
    return {"metric_id": str(metric.metric_id)}
