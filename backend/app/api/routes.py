from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.schemas import (
    LoginRequest,
    TokenResponse,
    DashboardResponse,
    MetricIngestRequest,
)
from app.core.database import get_db
from app.models.entities import Patient
from app.services.auth import authenticate_user, create_access_token, get_current_user
from app.services.dashboard import get_dashboard
from app.services.metrics import ingest_metric

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, payload.email)
    token = create_access_token({
        "sub": str(user.user_id),
        "hospital_id": str(user.hospital_id),
        "role": user.role,
    })
    return TokenResponse(access_token=token)


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    data = get_dashboard(db)
    return data


@router.get("/patients")
def patients(status: str | None = None, db: Session = Depends(get_db), user=Depends(get_current_user)):
    query = db.query(Patient).filter(Patient.hospital_id == user.hospital_id)
    if status:
        query = query.filter(Patient.current_status == status)
    patients = query.order_by(Patient.created_at.desc()).all()
    return patients


@router.get("/patients/{patient_id}")
def patient_detail(patient_id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == patient_id, Patient.hospital_id == user.hospital_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/ingest/metrics")
def ingest(payload: MetricIngestRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    patient = (
        db.query(Patient)
        .filter(Patient.patient_id == payload.patient_id, Patient.hospital_id == user.hospital_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    measured_at = payload.measured_at or datetime.now(timezone.utc)
    metric = ingest_metric(db, patient, payload.metric_type, payload.metric_value, measured_at)
    return {"metric_id": str(metric.metric_id)}
