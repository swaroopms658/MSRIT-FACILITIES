from pydantic import BaseModel, EmailStr, validator

class UserIn(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: str
    rollNumber: str

    @validator("email")
    def email_must_be_msrit(cls, v):
        if not v.endswith("@msrit.edu"):
            raise ValueError("Email must be of msrit.edu domain")
        return v

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    qr_code: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @validator("email")
    def email_must_be_msrit(cls, v):
        if not v.endswith("@msrit.edu"):
            raise ValueError("Email must be of msrit.edu domain")
        return v

class LoginResponse(BaseModel):
    access_token: str
    token_type: str