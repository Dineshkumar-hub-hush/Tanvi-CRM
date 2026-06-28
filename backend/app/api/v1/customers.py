from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.v1.auth import require_admin
from app.models import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate

router = APIRouter()


@router.get("", response_model=list[CustomerResponse])
def list_customers(
    search: Optional[str] = Query(default=None),
    segment: Optional[str] = Query(default=None),
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Customer)

    if search:
        term = search.strip()
        query = query.filter(
            or_(
                Customer.name.ilike(f"%{term}%"),
                Customer.email.ilike(f"%{term}%"),
                Customer.phone.ilike(f"%{term}%"),
            )
        )

    if segment:
        query = query.filter(Customer.segment == segment)

    return query.order_by(Customer.created_at.desc()).all()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.segment not in {"VIP", "Regular", "New"}:
        raise HTTPException(status_code=400, detail="Segment must be VIP, Regular, or New")

    existing = db.query(Customer).filter(Customer.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")

    customer = Customer(**payload.dict())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if payload.segment not in {"VIP", "Regular", "New"}:
        raise HTTPException(status_code=400, detail="Segment must be VIP, Regular, or New")

    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    email_owner = db.query(Customer).filter(Customer.email == payload.email, Customer.id != customer_id).first()
    if email_owner:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")

    for field, value in payload.dict().items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(customer)
    db.commit()
    return None
