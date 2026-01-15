# Clinical Alert Hub

MVP funcional de un modulo clinico de alertas en tiempo casi real. Incluye:
- Backend API con FastAPI + PostgreSQL.
- Frontend SPA para monitoreo de pacientes y alertas.
- Simulacion opcional para generar alertas y estados automaticamente en entorno de demo.

---

## Que hace

- Muestra conteos de pacientes por estado (critical/warning/normal).
- Lista pacientes recientes con estado actual.
- Lista alertas recientes con filtros (all/critical/unacknowledged).
- Permite reconocer alertas (acknowledge).
- Permite ver detalle basico de un paciente.

## Como lo hace

Backend:
- API REST en FastAPI.
- Persistencia en PostgreSQL usando SQLAlchemy.
- Reglas de negocio para evaluar metricas clinicas y generar alertas.
- Simulacion opcional que ingesta metricas y actualiza estados en background.

Frontend:
- SPA en React + Vite.
- Polling cada 30s al endpoint de dashboard.
- UI para filtros, paginacion y reconocimiento de alertas.

---

## Requisitos

- Python 3.10+
- Node 18+
- PostgreSQL 14+

---

## Ejecucion local (demo)

### 1) Base de datos

Opcion A: scripts SQL (no destructivo)

```bash
psql -d postgres -c "CREATE DATABASE clinical_alert_hub;"
psql -d clinical_alert_hub -f db/schema.sql
psql -d clinical_alert_hub -f db/seed.sql
```

Opcion B: script Powershell (destructivo, solo dev)

```powershell
.\db\create_db.ps1
```

> Este script elimina y recrea la base completa. NO usar en preproduccion/produccion.

### 2) Backend

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Variables de entorno:
- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `5432`)
- `DB_USER` (default: `clinical_user`)
- `DB_PASSWORD` (default: `123`)
- `DB_NAME` (default: `clinical_alert_hub`)
- `DB_SCHEMA` (default: `clinical_alert_hub`)
- `JWT_SECRET` (default: `dev_secret_change_me`)
- `JWT_EXPIRES_MINUTES` (default: `720`)
- `SIMULATION_ENABLED` (default: `1`)
- `SIMULATION_INTERVAL_SECONDS` (default: `5`)

Login demo: `maria.vega@clinic.com`

### 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Por defecto consume `http://localhost:8000`. Para cambiarlo:

```bash
set VITE_API_BASE=http://localhost:8000
```

---

## Simulacion

Cuando `SIMULATION_ENABLED=1`, el backend genera metricas de prueba y actualiza estados/alertas
cada `SIMULATION_INTERVAL_SECONDS`. Es util para demo. Para desactivar:

```bash
set SIMULATION_ENABLED=0
```

---

## Consideraciones para preproduccion/produccion

Estas no son "bloqueantes" para demo, pero si para entornos reales:

1) Seguridad y autenticacion
   - Reemplazar login por email-only.
   - Rotar `JWT_SECRET` y usar secretos por entorno.
   - Ajustar `JWT_EXPIRES_MINUTES` segun politica.

2) CORS
   - Limitar `allow_origins` a dominios permitidos.

3) Base de datos
   - Usar migraciones (p.ej. Alembic).
   - No usar `db/create_db.ps1` en preprod/prod.
   - Alinear `schema.sql`/`seed.sql` con el modelo ORM.

4) Simulacion
   - Desactivar por defecto en preprod/prod.

5) Observabilidad
   - Logs estructurados, metricas y trazas.

6) Datos clinicos reales
   - Integracion con EHR/HIS.
   - Auditoria de acciones clinicas.

---

## Estructura del repo

```
backend/        # FastAPI + SQLAlchemy
frontend/       # React SPA (Vite)
db/             # esquema, seed, script de base de datos
```
