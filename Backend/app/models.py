from pydantic import BaseModel, EmailStr

class UserIn(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr

class UserInDB(UserOut):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str
