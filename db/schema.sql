CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS clinical_alert_hub;
SET search_path TO clinical_alert_hub;

CREATE TABLE IF NOT EXISTS hospital (
    hospital_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user" (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospital(hospital_id),
    role VARCHAR(30) NOT NULL CHECK (role IN ('oncologist', 'clinician')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    push_token VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient (
    patient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES hospital(hospital_id),
    external_ref VARCHAR(100) NOT NULL,
    current_status VARCHAR(20) NOT NULL CHECK (current_status IN ('normal', 'warning', 'critical')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinical_metric (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    metric_type VARCHAR(50) NOT NULL,
    metric_value VARCHAR(50) NOT NULL,
    measured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patient_status_history (
    status_history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('normal', 'warning', 'critical')),
    reason TEXT NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patient(patient_id),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical')),
    reason TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS alert_recipient (
    alert_recipient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alert(alert_id),
    user_id UUID NOT NULL REFERENCES "user"(user_id),
    delivered_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ
);
