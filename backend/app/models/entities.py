import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.models.base import Base


class Hospital(Base):
    __tablename__ = "hospital"

    hospital_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base):
    __tablename__ = "user"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(String(30), nullable=False)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserHospital(Base):
    __tablename__ = "user_hospital"

    user_hospital_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.user.user_id"), nullable=False)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.hospital.hospital_id"), nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Device(Base):
    __tablename__ = "device"

    device_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.user.user_id"), nullable=False)
    platform = Column(String(20), nullable=False)
    push_token = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    last_seen_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Patient(Base):
    __tablename__ = "patient"

    patient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.hospital.hospital_id"), nullable=False)
    external_ref = Column(String(100), nullable=False)
    current_status = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ClinicalMetric(Base):
    __tablename__ = "clinical_metric"

    metric_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.patient.patient_id"), nullable=False)
    metric_type = Column(String(50), nullable=False)
    metric_value = Column(String(50), nullable=False)
    measured_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PatientStatusHistory(Base):
    __tablename__ = "patient_status_history"

    status_history_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.patient.patient_id"), nullable=False)
    status = Column(String(20), nullable=False)
    reason = Column(Text, nullable=False)
    changed_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    __tablename__ = "alert"

    alert_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.patient.patient_id"), nullable=False)
    severity = Column(String(20), nullable=False)
    reason = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AlertRecipient(Base):
    __tablename__ = "alert_recipient"

    alert_recipient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.alert.alert_id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("clinical_alert_hub.user.user_id"), nullable=False)
    delivered_at = Column(DateTime(timezone=True))
    acknowledged_at = Column(DateTime(timezone=True))
