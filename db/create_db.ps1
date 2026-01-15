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

CREATE TABLE hospital (
    hospital_id UUID PRIMARY KEY,
    name VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT hospital_status_chk CHECK (status IN ('active','inactive'))
);

CREATE TABLE "user" (
    user_id UUID PRIMARY KEY,
    hospital_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_role_chk CHECK (role IN ('oncologist','clinician')),
    CONSTRAINT fk_user_hospital
        FOREIGN KEY (hospital_id)
        REFERENCES hospital (hospital_id)
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
"@ | psql -h $PGHOST -p $PGPORT -U $DBUSER -d $DBNAME

Write-Host "✔ clinical_alert_hub creada correctamente"
