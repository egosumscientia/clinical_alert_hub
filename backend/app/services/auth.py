from datetime import datetime, timedelta, timezone
from uuid import UUID
from jose import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core import config
from app.core.database import get_db
from app.models.entities import User, UserHospital

security = HTTPBearer()


def create_access_token(payload: dict) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=config.JWT_EXPIRES_MINUTES)
    to_encode = payload.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)


def authenticate_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user


def get_primary_hospital_id(db: Session, user_id: UUID) -> UUID:
    record = (
        db.query(UserHospital)
        .filter(UserHospital.user_id == user_id)
        .order_by(UserHospital.is_primary.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No hospital access")
    return record.hospital_id


def user_has_hospital(db: Session, user_id: UUID, hospital_id: UUID) -> bool:
    return (
        db.query(UserHospital)
        .filter(UserHospital.user_id == user_id, UserHospital.hospital_id == hospital_id)
        .first()
        is not None
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[config.JWT_ALGORITHM])
        user_id = payload.get("sub")
        hospital_id = payload.get("hospital_id")
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    user = db.query(User).filter(User.user_id == user_id, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if hospital_id:
        try:
            hospital_uuid = UUID(str(hospital_id))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
        if not user_has_hospital(db, user.user_id, hospital_uuid):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized hospital")
        user.active_hospital_id = hospital_uuid
    return user


def resolve_hospital_id(request: Request, user: User, db: Session) -> UUID:
    header_value = request.headers.get("X-Hospital-Id")
    if header_value:
        try:
            hospital_id = UUID(str(header_value))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid hospital id") from exc
        if not user_has_hospital(db, user.user_id, hospital_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hospital access denied")
        return hospital_id

    active_hospital_id = getattr(user, "active_hospital_id", None)
    if not active_hospital_id:
        active_hospital_id = get_primary_hospital_id(db, user.user_id)
    return active_hospital_id
