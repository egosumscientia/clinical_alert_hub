from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PatientOut(BaseModel):
    patient_id: UUID
    hospital_id: UUID
    external_ref: str
    current_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertOut(BaseModel):
    alert_id: UUID
    patient_id: UUID
    severity: str
    reason: str
    is_acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    totals: dict
    patients: List[PatientOut]
    alerts: List[AlertOut]


class MetricIngestRequest(BaseModel):
    patient_id: str
    metric_type: str
    metric_value: float
    measured_at: Optional[datetime] = None
