from sqlalchemy import func, case, desc
from sqlalchemy.orm import Session

from app.models.entities import Patient, Alert


from datetime import datetime, timedelta, timezone
import time

def get_dashboard(
    db: Session,
    hospital_id,
    patients_limit: int,
    patients_offset: int,
    alerts_limit: int,
    alerts_offset: int,
    hours: int = 24,
):
    start_time = time.time()
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
    
    status_priority = case(
        (Patient.current_status == "critical", 3),
        (Patient.current_status == "warning", 2),
        else_=1,
    )

    patients_query = db.query(Patient).filter(Patient.hospital_id == hospital_id)
    patients = (
        patients_query
        .order_by(desc(status_priority), Patient.created_at.desc())
        .limit(patients_limit)
        .offset(patients_offset)
        .all()
    )

    alerts_query = (
        db.query(Alert)
        .join(Patient, Alert.patient_id == Patient.patient_id)
        .filter(
            Patient.hospital_id == hospital_id,
            Alert.created_at >= cutoff_time
        )
    )
    alerts = (
        alerts_query
        .order_by(Alert.created_at.desc())
        .limit(alerts_limit)
        .offset(alerts_offset)
        .all()
    )

    totals = (
        db.query(
            func.sum(case((Patient.current_status == "critical", 1), else_=0)).label("critical"),
            func.sum(case((Patient.current_status == "warning", 1), else_=0)).label("warning"),
            func.sum(case((Patient.current_status == "normal", 1), else_=0)).label("normal"),
        )
        .filter(Patient.hospital_id == hospital_id)
        .one()
    )

    print(f"Dashboard query took: {time.time() - start_time:.4f}s")
    return {
        "totals": {
            "critical": totals.critical or 0,
            "warning": totals.warning or 0,
            "normal": totals.normal or 0,
        },
        "patients": {
            "items": patients,
            "page": {
                "total": patients_query.count(),
                "limit": patients_limit,
                "offset": patients_offset,
            },
        },
        "alerts": {
            "items": alerts,
            "page": {
                "total": alerts_query.count(),
                "limit": alerts_limit,
                "offset": alerts_offset,
            },
        },
    }
