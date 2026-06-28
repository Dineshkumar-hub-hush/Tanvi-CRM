import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import AdminUser
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserProfile

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def authenticate_admin(db: Session, email: str, password: str) -> AdminUser | None:
    admin = db.query(AdminUser).filter(AdminUser.email == normalize_email(email)).first()
    if not admin or not admin.is_active or not verify_password(password, admin.hashed_password):
        return None
    return admin


def admin_profile(admin: AdminUser) -> UserProfile:
    return UserProfile(
        email=admin.email,
        display_name=admin.display_name or admin.email.split("@")[0].replace(".", " ").title(),
        role=admin.role or "admin",
    )


def issue_admin_token(admin: AdminUser) -> TokenResponse:
    token = create_access_token(
        {"sub": admin.email, "role": admin.role or "admin"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(access_token=token, user=admin_profile(admin))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = authenticate_admin(db, payload.email, payload.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return issue_admin_token(admin)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = normalize_email(payload.email)
    existing_admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if existing_admin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    admin = AdminUser(
        email=email,
        display_name=payload.display_name,
        role="admin",
        hashed_password=get_password_hash(payload.password),
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    return issue_admin_token(admin)


@router.post("/token", response_model=TokenResponse)
def token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    admin = authenticate_admin(db, form_data.username, form_data.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return issue_admin_token(admin)


@router.get("/me")
def get_current_admin(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    admin = db.query(AdminUser).filter(AdminUser.email == normalize_email(email)).first()
    if admin is None or not admin.is_active:
        raise credentials_exception
    return admin_profile(admin)


def require_admin(current_admin: Annotated[UserProfile, Depends(get_current_admin)]):
    if current_admin.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_admin
