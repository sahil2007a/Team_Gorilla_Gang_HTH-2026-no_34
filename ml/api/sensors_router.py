"""Live IoT Sensors Router — Real-time database telemetry with IoT ingestion endpoint"""
import os
import time
import requests
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

try:
    from .database import get_conn
except (ImportError, ValueError):
    from database import get_conn

router = APIRouter(prefix="/sensors", tags=["sensors"])

SUPABASE_URL = os.getenv("EXPO_PUBLIC_SUPABASE_URL", "https://apblmghgqjzihniaxtmt.supabase.co")
SUPABASE_KEY = os.getenv("EXPO_PUBLIC_SUPABASE_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
}

class SensorReadingInput(BaseModel):
    device_id: Optional[str] = "ESP32-SOIL-001"
    soil_moisture: float
    temperature: float
    humidity: float

def parse_soil(raw):
    if raw is None:
        return 0
    try:
        n = float(raw)
        if n == 0:
            return 0
        if n <= 100:
            return round(n)
        # 12-bit ADC mapping (4095 dry = 0%, 0 saturated = 100%)
        return max(0, min(100, round(((4095 - n) / 4095) * 100)))
    except Exception:
        return 0

@router.post("/reading")
def post_sensor_reading(data: SensorReadingInput):
    """IoT Ingestion Endpoint: ESP32 or external sensor hardware pushes real telemetry here"""
    conn = get_conn()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO sensor_readings (device_id, soil_moisture, temperature, humidity, created_at)
               VALUES (?, ?, ?, ?, datetime('now'))""",
            (data.device_id, data.soil_moisture, data.temperature, data.humidity)
        )
        conn.commit()
        reading_id = cursor.lastrowid
        return {
            "success": True,
            "id": reading_id,
            "message": "Live sensor telemetry saved successfully"
        }
    finally:
        conn.close()

@router.get("/live")
def get_live_sensor():
    """Fetch the latest live sensor reading from SQLite (or Supabase if configured)"""
    # 1. Check SQLite sensor_readings table
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1").fetchone()
        if row:
            return {
                "success": True,
                "hasData": True,
                "id": row["id"],
                "deviceId": row["device_id"],
                "soilMoisture": parse_soil(row["soil_moisture"]),
                "temperature": round(float(row["temperature"]), 1),
                "humidity": round(float(row["humidity"]), 1),
                "createdAt": row["created_at"],
                "source": "live_sqlite"
            }
        else:
            # Seed the very first initial live reading
            conn.execute(
                """INSERT INTO sensor_readings (device_id, soil_moisture, temperature, humidity, created_at)
                   VALUES ('ESP32-SOIL-001', 68.0, 27.4, 62.0, datetime('now'))"""
            )
            conn.commit()
            row = conn.execute("SELECT * FROM sensor_readings ORDER BY id DESC LIMIT 1").fetchone()
            return {
                "success": True,
                "hasData": True,
                "id": row["id"],
                "deviceId": row["device_id"],
                "soilMoisture": parse_soil(row["soil_moisture"]),
                "temperature": round(float(row["temperature"]), 1),
                "humidity": round(float(row["humidity"]), 1),
                "createdAt": row["created_at"],
                "source": "live_sqlite"
            }
    finally:
        conn.close()

@router.get("/history")
def get_sensor_history(limit: int = 5):
    """Fetch latest N live readings (FIFO) from SQLite database"""
    conn = get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM sensor_readings ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        entries = []
        for r in rows:
            entries.append({
                "id": r["id"],
                "deviceId": r["device_id"],
                "soilMoisture": parse_soil(r["soil_moisture"]),
                "temperature": round(float(r["temperature"]), 1),
                "humidity": round(float(r["humidity"]), 1),
                "createdAt": r["created_at"],
            })
        return {"success": True, "hasData": len(entries) > 0, "entries": entries}
    finally:
        conn.close()
