from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.simulation.runner import start_simulation_if_enabled

app = FastAPI(title="Clinical Alert Hub")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] ,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"] ,
)

app.include_router(router)


@app.on_event("startup")
async def startup_event():
    await start_simulation_if_enabled()
