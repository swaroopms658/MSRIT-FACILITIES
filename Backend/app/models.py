from pydantic import BaseModel, EmailStr, field_validator

MSRIT_DOMAIN = "@msrit.edu"

class UserIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str
    rollNumber: str

    @field_validator("email")
    @classmethod
    def email_must_be_msrit(cls, v: str) -> str:
        if not v.lower().endswith(MSRIT_DOMAIN):
            raise ValueError(f"Email must end with {MSRIT_DOMAIN}")
        return v


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    qr_code: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def email_must_be_msrit(cls, v: str) -> str:
        if not v.lower().endswith(MSRIT_DOMAIN):
            raise ValueError(f"Email must end with {MSRIT_DOMAIN}")
        return v


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
