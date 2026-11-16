from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field

from app import db
from config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
bearer_scheme = HTTPBearer(auto_error=False)

# Same cost as real hashes, so a missing account does not return faster than a wrong password.
_DUMMY_PASSWORD_HASH = bcrypt.hashpw(b"unused", bcrypt.gensalt())


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserResponse(BaseModel):
    id: int
    email: str
    name: str


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str | bytes) -> bool:
    hashed = hashed_password.encode("utf-8") if isinstance(hashed_password, str) else hashed_password
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed)
    except ValueError:
        return False


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        return None


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    """Return the active user for a bearer token. Raises 401 otherwise."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise _unauthorized()

    try:
        user_id = int(payload["sub"])
    except (TypeError, ValueError):
        raise _unauthorized() from None

    user = db.get_user_by_id(user_id)
    if user is None:
        raise _unauthorized()
    return user


def _token_for(user: dict) -> TokenResponse:
    return TokenResponse(access_token=create_access_token(user["id"]))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: UserRegister) -> TokenResponse:
    user = db.create_user(body.email, body.name, hash_password(body.password))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    return _token_for(user)


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin) -> TokenResponse:
    user = db.get_user_by_email(body.email)
    password_hash = user["password_hash"] if user else _DUMMY_PASSWORD_HASH
    if user is None or not verify_password(body.password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return _token_for(user)


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user: dict = Depends(get_current_user)) -> dict:
    return current_user
