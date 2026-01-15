from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.entities import ClinicalMetric, Patient, PatientStatusHistory, Alert, AlertRecipient, User


def evaluate_status(metric_type: str, metric_value: float) -> tuple[str, str]:
    if metric_type == "heart_rate":
        if metric_value >= 120:
            return "critical", "Heart rate exceeds 120"
        if metric_value >= 100:
            return "warning", "Heart rate exceeds 100"
        return "normal", "Heart rate within normal range"
    if metric_type == "spo2":
        if metric_value <= 90:
            return "critical", "SpO2 at or below 90"
        if metric_value <= 94:
            return "warning", "SpO2 below 95"
        return "normal", "SpO2 within normal range"
    if metric_type == "respiratory_rate":
        if metric_value >= 30:
            return "critical", "Respiratory rate exceeds 30"
        if metric_value >= 22:
            return "warning", "Respiratory rate exceeds 22"
        return "normal", "Respiratory rate within normal range"
    if metric_value >= 1:
        return "warning", f"{metric_type} outside expected range"
    return "normal", f"{metric_type} within expected range"


def ingest_metric(db: Session, patient: Patient, metric_type: str, metric_value: float, measured_at: datetime):
    metric = ClinicalMetric(
        patient_id=patient.patient_id,
        metric_type=metric_type,
        metric_value=str(metric_value),
        measured_at=measured_at,
    )
    db.add(metric)

    new_status, reason = evaluate_status(metric_type, metric_value)
    if patient.current_status != new_status:
        patient.current_status = new_status
        status_entry = PatientStatusHistory(
            patient_id=patient.patient_id,
            status=new_status,
            reason=reason,
            changed_at=measured_at,
        )
        db.add(status_entry)

        if new_status in {"warning", "critical"}:
            alert = Alert(
                patient_id=patient.patient_id,
                severity=new_status,
                reason=reason,
                is_acknowledged=False,
            )
            db.add(alert)
            db.flush()

            recipients = db.query(User).filter(
                User.hospital_id == patient.hospital_id,
                User.is_active.is_(True),
            ).all()
            delivered_at = datetime.now(timezone.utc)
            for user in recipients:
                db.add(
                    AlertRecipient(
                        alert_id=alert.alert_id,
                        user_id=user.user_id,
                        delivered_at=delivered_at,
                    )
                )

    db.commit()
    db.refresh(patient)
    return metric
