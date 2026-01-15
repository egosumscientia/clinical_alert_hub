import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "clinical_alert_hub")
DB_USER = os.getenv("DB_USER", "clinical_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123")
DB_SCHEMA = os.getenv("DB_SCHEMA", "clinical_alert_hub")

JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "720"))

SIMULATION_ENABLED = os.getenv("SIMULATION_ENABLED", "1") == "1"
SIMULATION_INTERVAL_SECONDS = int(os.getenv("SIMULATION_INTERVAL_SECONDS", "5"))
