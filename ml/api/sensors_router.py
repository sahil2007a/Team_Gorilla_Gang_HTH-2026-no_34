"""Live IoT Sensors Router — Direct Supabase connector with zero lag"""
import os
import requests
from fastapi import APIRouter
from typing import Optional

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


@router.get("/live")
def get_live_sensor():
    """Fetch the single latest live reading from Supabase sensor_readings table"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=id.desc&limit=1"
        res = requests.get(url, headers=HEADERS, timeout=4)
        if res.status_code == 200:
            rows = res.json()
            if rows:
                r = rows[0]
                temp = r.get("temperature")
                hum = r.get("humidity")
                return {
                    "success": True,
                    "hasData": True,
                    "id": r.get("id"),
                    "deviceId": r.get("device_id", "ESP32-SOIL-001"),
                    "soilMoisture": parse_soil(r.get("soil_moisture")),
                    "temperature": round(float(temp), 1) if temp is not None else None,
                    "humidity": round(float(hum), 1) if hum is not None else None,
                    "createdAt": r.get("created_at"),
                    "raw": r
                }
    except Exception as e:
        print("[Sensors Router] Error querying Supabase live:", e)

    return {
        "success": False,
        "hasData": False,
        "deviceId": "ESP32-SOIL-001",
        "soilMoisture": None,
        "temperature": None,
        "humidity": None,
        "createdAt": None
    }


@router.get("/history")
def get_sensor_history(limit: int = 5):
    """Fetch latest N live readings (FIFO) from Supabase sensor_readings table"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/sensor_readings?select=*&order=id.desc&limit={limit}"
        res = requests.get(url, headers=HEADERS, timeout=4)
        if res.status_code == 200:
            rows = res.json()
            entries = []
            for r in rows:
                temp = r.get("temperature")
                hum = r.get("humidity")
                entries.append({
                    "id": r.get("id"),
                    "deviceId": r.get("device_id", "ESP32-SOIL-001"),
                    "soilMoisture": parse_soil(r.get("soil_moisture")),
                    "temperature": round(float(temp), 1) if temp is not None else None,
                    "humidity": round(float(hum), 1) if hum is not None else None,
                    "createdAt": r.get("created_at"),
                    "raw": r
                })
            return {"success": True, "hasData": True, "entries": entries}
    except Exception as e:
        print("[Sensors Router] Error querying Supabase history:", e)

    return {"success": False, "hasData": False, "entries": []}
