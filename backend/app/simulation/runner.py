import asyncio
import random
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.core import config
from app.core.database import SessionLocal
from app.models.entities import Hospital, Patient, User, UserHospital
from app.services.metrics import ingest_metric

METRIC_TYPES = ["heart_rate", "spo2", "respiratory_rate"]


def ensure_seeded(db: Session):
    hospital = db.query(Hospital).first()
    if not hospital:
        hospital = Hospital(name="Central Clinic", status="active")
        db.add(hospital)
        db.flush()

    user = db.query(User).filter(User.email == "maria.vega@clinic.com").first()
    if not user:
        user = User(
            role="clinician",
            full_name="Dr. Maria Vega",
            email="maria.vega@clinic.com",
            is_active=True,
        )
        db.add(user)
        db.flush()

    user_hospital = (
        db.query(UserHospital)
        .filter(UserHospital.user_id == user.user_id, UserHospital.hospital_id == hospital.hospital_id)
        .first()
    )
    if not user_hospital:
        db.add(
            UserHospital(
                user_id=user.user_id,
                hospital_id=hospital.hospital_id,
                is_primary=True,
            )
        )

    patients = db.query(Patient).filter(Patient.hospital_id == hospital.hospital_id).all()
    if not patients:
        seed_statuses = [
            "critical",
            "warning",
            "normal",
            "normal",
            "critical",
            "warning",
            "normal",
            "normal",
            "normal",
            "normal",
        ]
        for idx, status in enumerate(seed_statuses, start=1):
            db.add(
                Patient(
                    hospital_id=hospital.hospital_id,
                    external_ref=f"CH-{1000 + idx}",
                    current_status=status,
                )
            )
    else:
        has_urgent = any(p.current_status in {"critical", "warning"} for p in patients)
        if not has_urgent and len(patients) <= 10:
            patients[0].current_status = "critical"
            if len(patients) > 1:
                patients[1].current_status = "warning"

    db.commit()


def random_metric_value(metric_type: str, status_bias: str) -> float:
    if metric_type == "heart_rate":
        if status_bias == "critical":
            return random.uniform(125, 150)
        if status_bias == "warning":
            return random.uniform(100, 120)
        return random.uniform(70, 95)
    if metric_type == "spo2":
        if status_bias == "critical":
            return random.uniform(85, 90)
        if status_bias == "warning":
            return random.uniform(91, 94)
        return random.uniform(96, 99)
    if status_bias == "critical":
        return random.uniform(30, 36)
    if status_bias == "warning":
        return random.uniform(22, 28)
    return random.uniform(14, 20)


def choose_status_cycle(current_status: str) -> str:
    order = ["normal", "warning", "critical", "normal"]
    try:
        idx = order.index(current_status)
        return order[(idx + 1) % len(order)]
    except ValueError:
        return "normal"


def run_simulation_step():
    db = SessionLocal()
    try:
        ensure_seeded(db)
        patients = db.query(Patient).all()
        for patient in patients:
            next_bias = choose_status_cycle(patient.current_status)
            metric_type = random.choice(METRIC_TYPES)
            value = random_metric_value(metric_type, next_bias)
            ingest_metric(
                db,
                patient,
                metric_type,
                value,
                datetime.now(timezone.utc),
                commit=False,
            )
        db.commit()
    except Exception as exc:
        print(f"Simulation loop error: {exc}")
    finally:
        db.close()


async def simulation_loop():
    loop = asyncio.get_running_loop()
    while True:
        await asyncio.sleep(config.SIMULATION_INTERVAL_SECONDS)
        await loop.run_in_executor(None, run_simulation_step)


async def start_simulation_if_enabled():
    db = SessionLocal()
    try:
        ensure_seeded(db)
    finally:
        db.close()

    if config.SIMULATION_ENABLED:
        asyncio.create_task(simulation_loop())
