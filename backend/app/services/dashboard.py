from sqlalchemy import func, case, desc
from sqlalchemy.orm import Session

from app.models.entities import Patient, Alert


def get_dashboard(db: Session):
    status_priority = case(
        (Patient.current_status == "critical", 3),
        (Patient.current_status == "warning", 2),
        else_=1,
    )

    patients = (
        db.query(Patient)
        .order_by(desc(status_priority), Patient.created_at.desc())
        .limit(20)
        .all()
    )

    alerts = (
        db.query(Alert)
        .order_by(Alert.created_at.desc())
        .limit(20)
        .all()
    )

    totals = (
        db.query(
            func.sum(case((Patient.current_status == "critical", 1), else_=0)).label("critical"),
            func.sum(case((Patient.current_status == "warning", 1), else_=0)).label("warning"),
            func.sum(case((Patient.current_status == "normal", 1), else_=0)).label("normal"),
        )
        .one()
    )

    return {
        "totals": {
            "critical": totals.critical or 0,
            "warning": totals.warning or 0,
            "normal": totals.normal or 0,
        },
        "patients": patients,
        "alerts": alerts,
    }
