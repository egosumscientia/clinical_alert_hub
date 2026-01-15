from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import MetaData

from app.core import config


class Base(DeclarativeBase):
    metadata = MetaData(schema=config.DB_SCHEMA)
