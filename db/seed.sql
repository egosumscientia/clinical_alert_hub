SET search_path TO clinical_alert_hub;

INSERT INTO hospital (hospital_id, name, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'Central Clinic', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO "user" (user_id, hospital_id, role, full_name, email, is_active)
VALUES
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'clinician', 'Dr. Maria Vega', 'maria.vega@clinic.com', TRUE),
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'oncologist', 'Dr. Luis Ortega', 'luis.ortega@clinic.com', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO patient (patient_id, hospital_id, external_ref, current_status)
VALUES
    ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'CH-1001', 'critical'),
    ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'CH-1002', 'warning'),
    ('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'CH-1003', 'normal')
ON CONFLICT DO NOTHING;

INSERT INTO patient_status_history (status_history_id, patient_id, status, reason, changed_at)
VALUES
    ('77777777-7777-7777-7777-777777777777', '44444444-4444-4444-4444-444444444444', 'critical', 'Heart rate exceeds 120', now()),
    ('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'warning', 'SpO2 below 95', now())
ON CONFLICT DO NOTHING;

INSERT INTO clinical_metric (metric_id, patient_id, metric_type, metric_value, measured_at)
VALUES
    ('99999999-9999-9999-9999-999999999999', '44444444-4444-4444-4444-444444444444', 'heart_rate', '132', now()),
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', 'spo2', '93', now())
ON CONFLICT DO NOTHING;

INSERT INTO alert (alert_id, patient_id, severity, reason, is_acknowledged)
VALUES
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444', 'critical', 'Heart rate exceeds 120', FALSE),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'warning', 'SpO2 below 95', FALSE)
ON CONFLICT DO NOTHING;

INSERT INTO alert_recipient (alert_recipient_id, alert_id, user_id, delivered_at)
VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', now()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', now()),
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', now())
ON CONFLICT DO NOTHING;
