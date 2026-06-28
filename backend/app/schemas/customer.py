from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, conint, constr, field_validator

CustomerText = constr(strip_whitespace=True, min_length=1, max_length=120)
CustomerNotes = constr(strip_whitespace=True, max_length=1000)


class CustomerBase(BaseModel):
    name: CustomerText
    email: EmailStr
    phone: CustomerText
    category: CustomerText
    segment: CustomerText
    total_spend: conint(ge=0) = 0
    last_purchase_date: Optional[constr(strip_whitespace=True, max_length=32)] = None
    notes: Optional[CustomerNotes] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.lower()

    @field_validator("segment")
    @classmethod
    def validate_segment(cls, value):
        if value not in {"VIP", "Regular", "New"}:
            raise ValueError("Segment must be VIP, Regular, or New")
        return value


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(CustomerBase):
    pass


class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
