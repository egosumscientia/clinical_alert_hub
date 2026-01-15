# =========================================================
# clinical_alert_hub – FINAL SCRIPT POWERSHELL (CORRECTO)
# =========================================================

$ErrorActionPreference = "Stop"

$PGHOST  = "localhost"
$PGPORT  = "5432"
$PGADMIN = "postgres"

$DBNAME  = "clinical_alert_hub"
$DBUSER  = "clinical_user"
$DBPASS  = "123"
$SCHEMA  = "clinical_alert_hub"

# =========================================================
# PASSWORD ADMIN
# =========================================================
$env:PGPASSWORD = Read-Host "Password del usuario postgres" -AsSecureString |
    ConvertFrom-SecureString -AsPlainText

# =========================================================
# CREATE ROLE (SI NO EXISTE)
# =========================================================
psql -h $PGHOST -p $PGPORT -U $PGADMIN -d postgres -c `
"CREATE ROLE $DBUSER LOGIN PASSWORD '$DBPASS';" `
2>$null

# =========================================================
# DROP DATABASE (COMANDO AISLADO)
# =========================================================
psql -h $PGHOST -p $PGPORT -U $PGADMIN -d postgres -c `
"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DBNAME' AND pid <> pg_backend_pid();"

psql -h $PGHOST -p $PGPORT -U $PGADMIN -d postgres -c `
"DROP DATABASE IF EXISTS $DBNAME;"

# =========================================================
# CREATE DATABASE (COMANDO AISLADO)
# =========================================================
psql -h $PGHOST -p $PGPORT -U $PGADMIN -d postgres -c `
"CREATE DATABASE $DBNAME OWNER $DBUSER;"

# =========================================================
# CONNECT AS APP USER
# =========================================================
$env:PGPASSWORD = $DBPASS

# =========================================================
# SCHEMA + TABLES + CONSTRAINTS (VÍA STDIN)
# =========================================================
@"
CREATE SCHEMA IF NOT EXISTS $SCHEMA AUTHORIZATION $DBUSER;
SET search_path TO $SCHEMA;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE hospital (
    hospital_id UUID PRIMARY KEY,
    name VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT hospital_status_chk CHECK (status IN ('active','inactive'))
);

CREATE TABLE "user" (
    user_id UUID PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_role_chk CHECK (role IN ('oncologist','clinician'))
);

CREATE TABLE user_hospital (
    user_hospital_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    hospital_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_uh_user
        FOREIGN KEY (user_id)
        REFERENCES "user" (user_id),
    CONSTRAINT fk_uh_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id),
    CONSTRAINT user_hospital_unique UNIQUE (user_id, hospital_id)
);

CREATE TABLE device (
    device_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    platform VARCHAR(20) NOT NULL,
    push_token VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT device_platform_chk CHECK (platform IN ('ios','android')),
    CONSTRAINT fk_device_user
        FOREIGN KEY (user_id)
        REFERENCES "user" (user_id)
);

CREATE TABLE patient (
    patient_id UUID PRIMARY KEY,
    hospital_id UUID NOT NULL,
    external_ref VARCHAR(100),
    current_status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT patient_status_chk CHECK (current_status IN ('normal','warning','critical')),
    CONSTRAINT fk_patient_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id)
);

CREATE TABLE clinical_metric (
    metric_id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    metric_type VARCHAR(50),
    metric_value VARCHAR(50),
    measured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_metric_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient (patient_id)
);

CREATE TABLE patient_status_history (
    status_history_id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT psh_status_chk CHECK (status IN ('normal','warning','critical')),
    CONSTRAINT fk_psh_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient (patient_id)
);

CREATE TABLE alert (
    alert_id UUID PRIMARY KEY,
    patient_id UUID NOT NULL,
    severity VARCHAR(20) NOT NULL,
    reason TEXT,
    is_acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT alert_severity_chk CHECK (severity IN ('warning','critical')),
    CONSTRAINT fk_alert_patient
        FOREIGN KEY (patient_id)
        REFERENCES patient (patient_id)
);

CREATE TABLE alert_recipient (
    alert_recipient_id UUID PRIMARY KEY,
    alert_id UUID NOT NULL,
    user_id UUID NOT NULL,
    delivered_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    CONSTRAINT fk_ar_alert
        FOREIGN KEY (alert_id)
        REFERENCES alert (alert_id),
    CONSTRAINT fk_ar_user
        FOREIGN KEY (user_id)
        REFERENCES "user" (user_id)
);

WITH hospitals AS (
    SELECT
        gen_random_uuid() AS hospital_id,
        gs AS idx,
        CASE WHEN gs = 1 THEN 'Central Clinic' ELSE 'Clinic ' || gs END AS name
    FROM generate_series(1, 5) gs
),
ins_hospitals AS (
INSERT INTO hospital (hospital_id, name, status)
    SELECT hospital_id, name, 'active' FROM hospitals
    RETURNING hospital_id
),
seed_users AS (
    SELECT
        h.idx AS h_idx,
        u.idx AS u_idx,
        gen_random_uuid() AS user_id,
        CASE WHEN h.idx = 1 AND u.idx = 1 THEN 'clinician'
             WHEN u.idx % 2 = 0 THEN 'clinician'
             ELSE 'oncologist'
        END AS role,
        CASE WHEN h.idx = 1 AND u.idx = 1 THEN 'Dr. Maria Vega'
             ELSE 'Dr. User ' || h.idx || '-' || u.idx
        END AS full_name,
        CASE WHEN h.idx = 1 AND u.idx = 1 THEN 'maria.vega@clinic.com'
             ELSE 'user' || h.idx || '_' || u.idx || '@clinic.com'
        END AS email
    FROM hospitals h
    CROSS JOIN generate_series(1, 6) AS u(idx)
),
ins_users AS (
    INSERT INTO "user" (user_id, role, full_name, email, is_active)
    SELECT user_id, role, full_name, email, true FROM seed_users
    RETURNING user_id
),
ins_user_hospitals AS (
    INSERT INTO user_hospital (user_hospital_id, user_id, hospital_id, is_primary)
    SELECT
        gen_random_uuid(),
        su.user_id,
        h.hospital_id,
        true
    FROM seed_users su
    JOIN ins_users u ON u.user_id = su.user_id
    JOIN hospitals h ON h.idx = su.h_idx
    UNION ALL
    SELECT
        gen_random_uuid(),
        su.user_id,
        h.hospital_id,
        false
    FROM seed_users su
    JOIN ins_users u ON u.user_id = su.user_id
    JOIN hospitals h ON h.idx = 1
    WHERE su.u_idx = 1 AND su.h_idx <> 1
    UNION ALL
    SELECT
        gen_random_uuid(),
        su.user_id,
        h.hospital_id,
        false
    FROM seed_users su
    JOIN ins_users u ON u.user_id = su.user_id
    JOIN hospitals h ON h.idx = 2
    WHERE su.u_idx = 1 AND su.h_idx = 1
    RETURNING user_hospital_id
),
seed_done AS (
    SELECT 1 AS ready FROM ins_user_hospitals LIMIT 1
),
ins_patients AS (
    INSERT INTO patient (patient_id, hospital_id, external_ref, current_status, created_at)
    SELECT
        gen_random_uuid(),
        h.hospital_id,
        'CH-' || h.idx || '-' || p.idx,
        CASE
            WHEN p.idx % (10 + h.idx) = 0 THEN 'critical'
            WHEN p.idx % (5 + (h.idx % 3)) = 0 THEN 'warning'
            ELSE 'normal'
        END,
        now() - (p.idx || ' hours')::interval
    FROM hospitals h
    CROSS JOIN generate_series(1, 120) AS p(idx)
    RETURNING patient_id, hospital_id, current_status
),
ins_alerts AS (
    INSERT INTO alert (alert_id, patient_id, severity, reason, is_acknowledged, created_at)
    SELECT
        gen_random_uuid(),
        p.patient_id,
        CASE WHEN p.current_status = 'critical' THEN 'critical' ELSE 'warning' END,
        CASE WHEN p.current_status = 'critical' THEN 'Heart rate exceeds 120' ELSE 'SpO2 below 95' END,
        false,
        now() - (random() * 48 || ' hours')::interval
    FROM ins_patients p
    WHERE p.current_status IN ('critical', 'warning')
    RETURNING alert_id, patient_id
)
INSERT INTO alert_recipient (alert_recipient_id, alert_id, user_id, delivered_at)
SELECT
    gen_random_uuid(),
    a.alert_id,
    u.user_id,
    now()
FROM ins_alerts a
JOIN ins_patients p ON p.patient_id = a.patient_id
JOIN user_hospital uh ON uh.hospital_id = p.hospital_id
JOIN "user" u ON u.user_id = uh.user_id
JOIN seed_done sd ON sd.ready = 1;
"@ | psql -h $PGHOST -p $PGPORT -U $DBUSER -d $DBNAME

Write-Host "✔ clinical_alert_hub creada correctamente"
