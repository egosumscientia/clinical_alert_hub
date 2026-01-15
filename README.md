# Clinical_Alert_Hub

MVP funcional de un modulo clinico de alertas en tiempo casi real con backend FastAPI, PostgreSQL local y frontend SPA.

## Backend

1. Crear base de datos y cargar esquema/seed:

```bash
psql -d postgres -c "CREATE DATABASE clinical_alert_hub;"
psql -d clinical_alert_hub -f db/schema.sql
psql -d clinical_alert_hub -f db/seed.sql
```

2. Crear entorno y dependencias:

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

3. Configurar variables opcionales:

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `clinical_user`)
- `DB_PASSWORD` (default: `123`)
- `DB_NAME` (default: `clinical_alert_hub`)
- `DB_SCHEMA` (default: `clinical_alert_hub`)
- `SIMULATION_ENABLED` (default: `1`)
- `SIMULATION_INTERVAL_SECONDS` (default: `5`)

4. Levantar API:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Login demo: `maria.vega@clinic.com`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Por defecto consume `http://localhost:8000`. Para cambiarlo:

```bash
set VITE_API_BASE=http://localhost:8000
```

## Modo simulacion

La simulacion se activa automaticamente cuando `SIMULATION_ENABLED=1`.
Cada intervalo genera metricas reales y actualiza estados/alertas usando los mismos servicios del backend.

Para desactivar:

```bash
set SIMULATION_ENABLED=0
```
