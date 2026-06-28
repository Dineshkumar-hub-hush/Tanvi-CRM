from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import require_admin
from app.db.database import get_db
from app.models import Customer, Purchase
from app.schemas.purchase import PurchaseCreate, PurchaseResponse, PurchaseUpdate

router = APIRouter()


@router.get("", response_model=list[PurchaseResponse])
def list_purchases(
    customer_id: Optional[int] = Query(default=None),
    category: Optional[str] = Query(default=None),
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Purchase)

    if customer_id is not None:
        query = query.filter(Purchase.customer_id == customer_id)

    if category:
        query = query.filter(Purchase.category == category)

    return query.order_by(Purchase.created_at.desc()).all()


@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    payload: PurchaseCreate,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    purchase = Purchase(**payload.dict())
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


@router.put("/{purchase_id}", response_model=PurchaseResponse)
def update_purchase(
    purchase_id: int,
    payload: PurchaseUpdate,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    for field, value in payload.dict().items():
        setattr(purchase, field, value)

    db.commit()
    db.refresh(purchase)
    return purchase


@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase(
    purchase_id: int,
    current_admin: dict = Depends(require_admin),
    db: Session = Depends(get_db),
):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    db.delete(purchase)
    db.commit()
    return None
