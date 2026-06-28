from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, conint, constr, field_validator

PurchaseText = constr(strip_whitespace=True, min_length=1, max_length=120)
PurchaseNotes = constr(strip_whitespace=True, max_length=1000)


class PurchaseBase(BaseModel):
    customer_id: conint(gt=0)
    category: PurchaseText
    amount: conint(ge=0)
    payment_status: PurchaseText = "Paid"
    purchase_date: Optional[constr(strip_whitespace=True, max_length=32)] = None
    notes: Optional[PurchaseNotes] = None

    @field_validator("payment_status")
    @classmethod
    def validate_payment_status(cls, value):
        if value not in {"Paid", "Pending", "Refunded"}:
            raise ValueError("Payment status must be Paid, Pending, or Refunded")
        return value


class PurchaseCreate(PurchaseBase):
    pass


class PurchaseUpdate(PurchaseBase):
    pass


class PurchaseResponse(PurchaseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
