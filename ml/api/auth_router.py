"""Auth routes: register, login, logout, profile with multi-field and admin fallback support"""
import re
import json
import bcrypt
import secrets
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, field_validator
from typing import Optional
try:
    from .database import get_conn, row_to_dict, rows_to_list
except (ImportError, ValueError):
    from database import get_conn, row_to_dict, rows_to_list

router = APIRouter(prefix="/auth", tags=["auth"])

# ─── Validators ──────────────────────────────────────────────────────────────

MOBILE_RE = re.compile(r"^\d{10}$")
AADHAAR_RE = re.compile(r"^\d{12}$")
NAME_RE = re.compile(r"^[A-Za-z\s]{3,60}$")


class RegisterRequest(BaseModel):
    name: str
    mobile: str
    password: str
    village: str
    district: str
    state: Optional[str] = "Maharashtra"
    aadhaar: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        v = v.strip()
        if not NAME_RE.match(v):
            raise ValueError("Name must be 3–60 letters only (no numbers or special characters)")
        return v

    @field_validator("mobile")
    @classmethod
    def validate_mobile(cls, v):
        v = v.strip().replace(" ", "").replace("+91", "").replace("-", "")
        if not MOBILE_RE.match(v):
            raise ValueError("Mobile number must be exactly 10 digits")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

    @field_validator("village")
    @classmethod
    def validate_village(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Village name must be at least 2 characters")
        return v

    @field_validator("district")
    @classmethod
    def validate_district(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("District name must be at least 2 characters")
        return v

    @field_validator("aadhaar")
    @classmethod
    def validate_aadhaar(cls, v):
        if v is None or v.strip() == "":
            return None
        v = v.strip().replace(" ", "")
        if not AADHAAR_RE.match(v):
            raise ValueError("Aadhaar must be exactly 12 digits")
        return v


class LoginRequest(BaseModel):
    mobile: str
    password: str

    @field_validator("mobile")
    @classmethod
    def clean_mobile(cls, v):
        return v.strip()

    @field_validator("password")
    @classmethod
    def clean_password(cls, v):
        return v.strip()


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("/register")
def register(req: RegisterRequest):
    conn = get_conn()
    try:
        # Check duplicate mobile
        existing = conn.execute(
            "SELECT id FROM farmers WHERE mobile = ?", (req.mobile,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="A farmer with this mobile number is already registered.")

        # Check duplicate Aadhaar if provided
        if req.aadhaar:
            dup_aadhaar = conn.execute(
                "SELECT id FROM farmers WHERE aadhaar = ?", (req.aadhaar,)
            ).fetchone()
            if dup_aadhaar:
                raise HTTPException(status_code=409, detail="This Aadhaar number is already registered.")

        # Hash password
        pw_hash = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
        token = secrets.token_hex(32)

        conn.execute(
            """INSERT INTO farmers (name, mobile, aadhaar, village, district, state, password_hash, token)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (req.name, req.mobile, req.aadhaar, req.village, req.district, req.state, pw_hash, token)
        )
        conn.commit()

        farmer = row_to_dict(conn.execute(
            "SELECT id, name, mobile, village, district, state, aadhaar, created_at FROM farmers WHERE mobile = ?",
            (req.mobile,)
        ).fetchone())
        farmer["location"] = f"{farmer['village']}, {farmer['district']}"

        return {"success": True, "token": token, "farmer": farmer}
    finally:
        conn.close()


@router.post("/login")
def login(req: LoginRequest):
    conn = get_conn()
    try:
        clean_input = req.mobile.replace(" ", "").replace("+91", "").replace("-", "")
        
        # 1. Search in farmers table by mobile OR name
        row = conn.execute(
            "SELECT * FROM farmers WHERE mobile = ? OR mobile = ? OR LOWER(name) = LOWER(?)",
            (clean_input, req.mobile, req.mobile)
        ).fetchone()

        if row:
            farmer = dict(row)
            if not bcrypt.checkpw(req.password.encode(), farmer["password_hash"].encode()):
                # Also accept master/admin password for convenience
                if req.password != "Agriflow@2026" and req.password != "Sakshi@2026":
                    raise HTTPException(status_code=401, detail="Incorrect password.")

            # Generate new token
            token = secrets.token_hex(32)
            conn.execute("UPDATE farmers SET token = ? WHERE id = ?", (token, farmer["id"]))
            conn.commit()

            # Load their crops
            crops = rows_to_list(conn.execute(
                "SELECT * FROM farmer_crops WHERE farmer_id = ?", (farmer["id"],)
            ).fetchall())

            safe_farmer = {
                "id": farmer["id"],
                "name": farmer["name"],
                "mobile": farmer["mobile"],
                "village": farmer["village"],
                "district": farmer["district"],
                "state": farmer["state"],
                "location": f"{farmer['village']}, {farmer['district']}",
                "aadhaar": farmer["aadhaar"],
                "created_at": farmer["created_at"],
                "crops": crops,
            }

            return {"success": True, "token": token, "farmer": safe_farmer}

        # 2. Check admin_users table (e.g. username 'Agriflow')
        admin_row = conn.execute(
            "SELECT * FROM admin_users WHERE LOWER(username) = LOWER(?)",
            (req.mobile,)
        ).fetchone()

        if admin_row:
            admin_user = dict(admin_row)
            if not bcrypt.checkpw(req.password.encode(), admin_user["password_hash"].encode()):
                if req.password != "Agriflow@2026":
                    raise HTTPException(status_code=401, detail="Incorrect password.")

            token = secrets.token_hex(32)
            conn.execute("UPDATE admin_users SET token = ? WHERE id = ?", (token, admin_user["id"]))
            conn.commit()

            return {
                "success": True,
                "token": token,
                "is_admin": True,
                "farmer": {
                    "id": admin_user["id"],
                    "name": admin_user["username"],
                    "mobile": "9999999999",
                    "village": "Headquarters",
                    "district": "Nagpur",
                    "state": "Maharashtra",
                    "location": "Headquarters, Nagpur",
                    "crops": [
                        {"id": 1, "crop_name": "Cotton", "field_name": "Main Zone A", "acreage": 4.5},
                        {"id": 2, "crop_name": "Soybean", "field_name": "East Block", "acreage": 3.0}
                    ]
                }
            }

        raise HTTPException(
            status_code=401,
            detail="No account found with this mobile number or username. Please check your credentials or register."
        )

    finally:
        conn.close()


@router.post("/logout")
def logout(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No token provided")
    token = authorization.replace("Bearer ", "")
    conn = get_conn()
    try:
        conn.execute("UPDATE farmers SET token = NULL WHERE token = ?", (token,))
        conn.execute("UPDATE admin_users SET token = NULL WHERE token = ?", (token,))
        conn.commit()
        return {"success": True, "message": "Logged out successfully"}
    finally:
        conn.close()


@router.get("/profile")
def get_profile(authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    conn = get_conn()
    try:
        # Check farmers
        row = conn.execute(
            "SELECT id, name, mobile, village, district, state, aadhaar, created_at FROM farmers WHERE token = ?",
            (token,)
        ).fetchone()
        if row:
            farmer = dict(row)
            crops = rows_to_list(conn.execute(
                "SELECT * FROM farmer_crops WHERE farmer_id = ?", (farmer["id"],)
            ).fetchall())
            farmer["crops"] = crops
            farmer["location"] = f"{farmer['village']}, {farmer['district']}"
            return {"success": True, "farmer": farmer}

        # Check admin_users
        admin_row = conn.execute(
            "SELECT id, username, created_at FROM admin_users WHERE token = ?",
            (token,)
        ).fetchone()
        if admin_row:
            admin_user = dict(admin_row)
            return {
                "success": True,
                "farmer": {
                    "id": admin_user["id"],
                    "name": admin_user["username"],
                    "mobile": "9999999999",
                    "village": "Headquarters",
                    "district": "Nagpur",
                    "state": "Maharashtra",
                    "location": "Headquarters, Nagpur",
                    "crops": []
                }
            }

        raise HTTPException(status_code=401, detail="Invalid or expired session")
    finally:
        conn.close()


@router.post("/crops")
def add_crop(body: dict, authorization: str = Header(None)):
    token = (authorization or "").replace("Bearer ", "")
    conn = get_conn()
    try:
        row = conn.execute("SELECT id FROM farmers WHERE token = ?", (token,)).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Unauthorized")
        farmer_id = row["id"]
        conn.execute(
            "INSERT INTO farmer_crops (farmer_id, crop_name, field_name, acreage, sown_date) VALUES (?,?,?,?,?)",
            (farmer_id, body.get("crop_name"), body.get("field_name"), body.get("acreage"), body.get("sown_date"))
        )
        conn.commit()
        return {"success": True}
    finally:
        conn.close()
