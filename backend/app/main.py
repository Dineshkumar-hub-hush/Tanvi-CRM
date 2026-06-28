import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.api.v1 import auth, customers, purchases
from app.db.database import Base, SessionLocal, engine
from app.models import AdminUser

app = FastAPI(title="TanviCRM API", version="1.0.0")

allowed_origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

Base.metadata.create_all(bind=engine)


def ensure_admin_columns():
    inspector = inspect(engine)
    if "admin_users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("admin_users")}
    with engine.begin() as connection:
        if "display_name" not in columns:
            connection.execute(text("ALTER TABLE admin_users ADD COLUMN display_name VARCHAR DEFAULT 'Admin User'"))
        if "role" not in columns:
            connection.execute(text("ALTER TABLE admin_users ADD COLUMN role VARCHAR DEFAULT 'admin'"))


def create_default_admin():
    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@tanvi.com")
        admin_email = auth.normalize_email(admin_email)
        admin_name = os.getenv("ADMIN_NAME", "Tanvi Admin")
        admin = db.query(AdminUser).filter(AdminUser.email == admin_email).first()
        if not admin:
            password = os.getenv("ADMIN_PASSWORD", "admin123")
            db.add(AdminUser(
                email=admin_email,
                display_name=admin_name,
                role="admin",
                hashed_password=auth.get_password_hash(password),
            ))
            db.commit()
        elif not admin.display_name or not admin.role:
            admin.display_name = admin.display_name or admin.email.split("@")[0].replace(".", " ").title()
            admin.role = admin.role or "admin"
            db.commit()
    finally:
        db.close()


ensure_admin_columns()
create_default_admin()
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(customers.router, prefix="/api/v1/customers", tags=["customers"])
app.include_router(purchases.router, prefix="/api/v1/purchases", tags=["purchases"])
