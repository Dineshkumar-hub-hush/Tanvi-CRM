from pydantic import BaseModel, EmailStr, constr

DisplayName = constr(strip_whitespace=True, min_length=2, max_length=80)


class LoginRequest(BaseModel):
    email: EmailStr
    password: constr(min_length=6, max_length=72, strip_whitespace=True)


class RegisterRequest(LoginRequest):
    display_name: DisplayName


class UserProfile(BaseModel):
    email: EmailStr
    display_name: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile
