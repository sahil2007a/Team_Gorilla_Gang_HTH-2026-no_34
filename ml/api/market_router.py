"""Market prices router — Comprehensive multi-city Mandi Intelligence with realistic live pricing & Community Trades"""
import json
from fastapi import APIRouter, HTTPException, Header, Query
from pydantic import BaseModel
from typing import Optional, List
try:
    from .database import get_conn, rows_to_list, row_to_dict
except (ImportError, ValueError):
    from database import get_conn, rows_to_list, row_to_dict

router = APIRouter(prefix="/market", tags=["market"])

# Multi-city APMC baseline rates database per crop
CITY_MANDIS = [
    {"city": "Nagpur", "market": "Nagpur APMC (Kalamna)", "state": "Maharashtra", "distance": "Local Hub (15 km)"},
    {"city": "Mumbai", "market": "Mumbai APMC (Vashi)", "state": "Maharashtra", "distance": "Metro Hub (820 km)"},
    {"city": "Pune", "market": "Pune APMC (Gultekdi Marketyard)", "state": "Maharashtra", "distance": "Major Market (710 km)"},
    {"city": "Nashik", "market": "Nashik APMC (Lasalgaon / Dindori)", "state": "Maharashtra", "distance": "Transit Hub (640 km)"},
    {"city": "Amravati", "market": "Amravati APMC Mandi", "state": "Maharashtra", "distance": "Regional (150 km)"},
    {"city": "Akola", "market": "Akola APMC Mandi", "state": "Maharashtra", "distance": "Regional (230 km)"},
    {"city": "Chhatrapati Sambhajinagar", "market": "CSN / Aurangabad APMC", "state": "Maharashtra", "distance": "Central (480 km)"},
    {"city": "Latur", "market": "Latur APMC (Pulses & Oilseeds)", "state": "Maharashtra", "distance": "Trading Hub (490 km)"},
    {"city": "Solapur", "market": "Solapur APMC Mandi", "state": "Maharashtra", "distance": "Southern (620 km)"},
    {"city": "Kolhapur", "market": "Kolhapur APMC (Shahupuri)", "state": "Maharashtra", "distance": "Western (780 km)"},
    {"city": "Ahmednagar", "market": "Ahmednagar APMC Mandi", "state": "Maharashtra", "distance": "Central (590 km)"},
    {"city": "Indore", "market": "Indore APMC (Choithram)", "state": "Madhya Pradesh", "distance": "Interstate (450 km)"},
    {"city": "Surat", "market": "Surat APMC Mandi", "state": "Gujarat", "distance": "Western (740 km)"},
    {"city": "Delhi", "market": "Delhi APMC (Azadpur National Mandi)", "state": "Delhi NCR", "distance": "National Hub (1,050 km)"},
]

# Benchmark price models for each crop
CROP_BASE_PRICES = {
    "Tomato": {"base_qtl": 3000, "unit": "quintal", "vol": "1,450 Qtl", "emoji": "🍅", "variety": "Hybrid Desi Red"},
    "Cotton": {"base_qtl": 7500, "unit": "quintal", "vol": "3,400 Qtl", "emoji": "🌿", "variety": "H-4 Long Staple"},
    "Soybean": {"base_qtl": 4900, "unit": "quintal", "vol": "5,100 Qtl", "emoji": "🌱", "variety": "JS-335 Clean Grade"},
    "Wheat": {"base_qtl": 2400, "unit": "quintal", "vol": "4,200 Qtl", "emoji": "🌾", "variety": "Sharbati Gold Grade"},
    "Chilli": {"base_qtl": 8800, "unit": "quintal", "vol": "850 Qtl", "emoji": "🌶️", "variety": "G4 Hot Green"},
    "Onion": {"base_qtl": 1950, "unit": "quintal", "vol": "6,800 Qtl", "emoji": "🧅", "variety": "Nashik Red Onion"},
    "Gram": {"base_qtl": 5900, "unit": "quintal", "vol": "1,900 Qtl", "emoji": "🫘", "variety": "Desi Chana Bold"},
    "Rice": {"base_qtl": 3200, "unit": "quintal", "vol": "3,800 Qtl", "emoji": "🍚", "variety": "Wada Kolam / BPT"},
    "Orange": {"base_qtl": 4500, "unit": "quintal", "vol": "2,100 Qtl", "emoji": "🍊", "variety": "Nagpur Mandarin Grade A"},
    "Tur": {"base_qtl": 9500, "unit": "quintal", "vol": "1,650 Qtl", "emoji": "🥣", "variety": "Marathwada White Grade A"},
    "Maize": {"base_qtl": 2200, "unit": "quintal", "vol": "2,700 Qtl", "emoji": "🌽", "variety": "Yellow Feed Grade"},
}

# City price adjustments (premium in major consumption metros)
CITY_PRICE_MODIFIERS = {
    "Delhi": 1.10,
    "Mumbai": 1.07,
    "Pune": 1.03,
    "Surat": 1.02,
    "Indore": 1.01,
    "Nagpur": 1.00,
    "Chhatrapati Sambhajinagar": 0.99,
    "Kolhapur": 0.99,
    "Latur": 0.98,
    "Nashik": 0.97,
    "Solapur": 0.97,
    "Ahmednagar": 0.96,
    "Amravati": 0.95,
    "Akola": 0.94,
}

# Default All-Crop Overview List
DEFAULT_ALL_CROPS = [
    {
        "crop_name": "Cotton",
        "variety": "H-4 Long Staple",
        "city": "Nagpur",
        "market": "Nagpur APMC (Kalamna)",
        "state": "Maharashtra",
        "distance": "Local Hub (15 km)",
        "price": 7500,
        "price_per_kg": 75,
        "prev_price": 7250,
        "change_pct": 3.4,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "3,400 Qtl",
        "demand": "High Demand 🔥",
        "price_date": "Today, 11:30 AM",
        "emoji": "🌿"
    },
    {
        "crop_name": "Soybean",
        "variety": "JS-335 Clean Grade",
        "city": "Amravati",
        "market": "Amravati APMC Mandi",
        "state": "Maharashtra",
        "distance": "Regional (150 km)",
        "price": 4900,
        "price_per_kg": 49,
        "prev_price": 4750,
        "change_pct": 3.1,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "5,100 Qtl",
        "demand": "High Demand 🔥",
        "price_date": "Today, 11:30 AM",
        "emoji": "🌱"
    },
    {
        "crop_name": "Tomato",
        "variety": "Hybrid Desi Red",
        "city": "Pune",
        "market": "Pune APMC (Gultekdi Marketyard)",
        "state": "Maharashtra",
        "distance": "Major Market (710 km)",
        "price": 3000,
        "price_per_kg": 30,
        "prev_price": 2850,
        "change_pct": 5.2,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "1,800 Qtl",
        "demand": "High Demand 🔥",
        "price_date": "Today, 11:30 AM",
        "emoji": "🍅"
    },
    {
        "crop_name": "Chilli",
        "variety": "G4 Hot Green",
        "city": "Nagpur",
        "market": "Nagpur APMC (Kalamna)",
        "state": "Maharashtra",
        "distance": "Local Hub (15 km)",
        "price": 8800,
        "price_per_kg": 88,
        "prev_price": 8500,
        "change_pct": 3.5,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "850 Qtl",
        "demand": "Stable 🟢",
        "price_date": "Today, 11:30 AM",
        "emoji": "🌶️"
    },
    {
        "crop_name": "Wheat",
        "variety": "Sharbati Gold Grade",
        "city": "Akola",
        "market": "Akola APMC Mandi",
        "state": "Maharashtra",
        "distance": "Regional (230 km)",
        "price": 2400,
        "price_per_kg": 24,
        "prev_price": 2320,
        "change_pct": 3.4,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "4,200 Qtl",
        "demand": "Stable 🟢",
        "price_date": "Today, 11:30 AM",
        "emoji": "🌾"
    },
    {
        "crop_name": "Onion",
        "variety": "Nashik Red Onion",
        "city": "Nashik",
        "market": "Nashik APMC (Lasalgaon)",
        "state": "Maharashtra",
        "distance": "Transit Hub (640 km)",
        "price": 1950,
        "price_per_kg": 20,
        "prev_price": 2100,
        "change_pct": -7.1,
        "is_up": False,
        "unit": "quintal",
        "daily_volume": "6,800 Qtl",
        "demand": "Moderate 🟡",
        "price_date": "Today, 11:30 AM",
        "emoji": "🧅"
    },
    {
        "crop_name": "Tur",
        "variety": "Marathwada White Grade A",
        "city": "Latur",
        "market": "Latur APMC (Pulses Market)",
        "state": "Maharashtra",
        "distance": "Trading Hub (490 km)",
        "price": 9500,
        "price_per_kg": 95,
        "prev_price": 9200,
        "change_pct": 3.2,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "1,650 Qtl",
        "demand": "High Demand 🔥",
        "price_date": "Today, 11:30 AM",
        "emoji": "🥣"
    },
    {
        "crop_name": "Gram",
        "variety": "Desi Chana Bold",
        "city": "Akola",
        "market": "Akola APMC Mandi",
        "state": "Maharashtra",
        "distance": "Regional (230 km)",
        "price": 5900,
        "price_per_kg": 59,
        "prev_price": 5750,
        "change_pct": 2.6,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "1,900 Qtl",
        "demand": "Stable 🟢",
        "price_date": "Today, 11:30 AM",
        "emoji": "🫘"
    },
    {
        "crop_name": "Orange",
        "variety": "Nagpur Mandarin Grade A",
        "city": "Nagpur",
        "market": "Nagpur APMC (Katol / Kalamna)",
        "state": "Maharashtra",
        "distance": "Local Hub (15 km)",
        "price": 4500,
        "price_per_kg": 45,
        "prev_price": 4300,
        "change_pct": 4.6,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "2,100 Qtl",
        "demand": "High Demand 🔥",
        "price_date": "Today, 11:30 AM",
        "emoji": "🍊"
    },
    {
        "crop_name": "Rice",
        "variety": "Wada Kolam / BPT",
        "city": "Bhandara",
        "market": "Bhandara APMC Mandi",
        "state": "Maharashtra",
        "distance": "Regional (65 km)",
        "price": 3200,
        "price_per_kg": 32,
        "prev_price": 3050,
        "change_pct": 4.9,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "3,800 Qtl",
        "demand": "Stable 🟢",
        "price_date": "Today, 11:30 AM",
        "emoji": "🍚"
    },
    {
        "crop_name": "Maize",
        "variety": "Yellow Feed Grade",
        "city": "Amravati",
        "market": "Amravati APMC Mandi",
        "state": "Maharashtra",
        "distance": "Regional (150 km)",
        "price": 2200,
        "price_per_kg": 22,
        "prev_price": 2100,
        "change_pct": 4.8,
        "is_up": True,
        "unit": "quintal",
        "daily_volume": "2,700 Qtl",
        "demand": "Stable 🟢",
        "price_date": "Today, 11:30 AM",
        "emoji": "🌽"
    },
]

CROP_EMOJIS = {
    "Tomato": "🍅",
    "Cotton": "🌿",
    "Cotton (Kapas)": "🌿",
    "Soybean": "🌱",
    "Wheat": "🌾",
    "Wheat (Sharbati)": "🌾",
    "Chilli": "🌶️",
    "Green Chilli": "🌶️",
    "Onion": "🧅",
    "Gram": "🫘",
    "Rice": "🍚",
    "Paddy / Rice": "🍚",
    "Orange": "🍊",
    "Nagpur Santra (Orange)": "🍊",
    "Tur": "🥣",
    "Maize": "🌽",
}


class RecordTradeRequest(BaseModel):
    farmer_name: str
    village: str
    district: str
    crop_name: str
    variety: Optional[str] = None
    price_per_kg: int
    price_per_quintal: int
    mandi_name: str
    quantity_sold: str


@router.get("/community-trades")
def get_community_trades(
    district: Optional[str] = Query("Nagpur"),
    village: Optional[str] = Query(None),
):
    """
    Returns real peer-to-peer trades reported by farmers in the given district/location
    (e.g., Nagpur, Ramtek, Saoner, Katol, Umred mandis).
    """
    conn = get_conn()
    try:
        # Retrieve trades matching district
        rows = conn.execute("""
            SELECT * FROM community_trades 
            WHERE district = ? OR ? = 'All' OR ? IS NULL
            ORDER BY id DESC LIMIT 25
        """, (district, district, district)).fetchall()

        # If no records exist for another district, fallback to Nagpur region trades
        if not rows:
            rows = conn.execute("SELECT * FROM community_trades ORDER BY id DESC LIMIT 25").fetchall()

        trades = []
        colors = ["#fee2e2", "#dcfce7", "#fef3c7", "#dbeafe", "#ffedd5", "#f3e8ff"]
        for r in rows:
            d = dict(r)
            d["farmerName"] = d["farmer_name"]
            d["cropName"] = d["crop_name"]
            d["pricePerKg"] = d["price_per_kg"]
            d["pricePerQuintal"] = d["price_per_quintal"]
            d["mandiName"] = d["mandi_name"]
            d["quantitySold"] = d["quantity_sold"]
            d["timeAgo"] = d["time_ago"]
            d["cropEmoji"] = CROP_EMOJIS.get(d["crop_name"], "🌾")
            d["avatarText"] = d["farmer_name"][0].upper() if d.get("farmer_name") else "F"
            d["avatarBg"] = colors[sum(ord(c) for c in d["farmer_name"]) % len(colors)]
            d["verified"] = bool(d.get("verified", 1))
            trades.append(d)

        return {
            "success": True,
            "district": district or "Nagpur",
            "trades": trades
        }
    finally:
        conn.close()


@router.post("/record-trade")
def record_community_trade(req: RecordTradeRequest):
    """Record a real farmer harvest sale in community trades"""
    conn = get_conn()
    try:
        conn.execute("""
            INSERT INTO community_trades (
                farmer_name, village, district, crop_name, variety,
                price_per_kg, price_per_quintal, mandi_name, quantity_sold, time_ago, verified
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Just now', 1)
        """, (
            req.farmer_name, req.village, req.district, req.crop_name, req.variety,
            req.price_per_kg, req.price_per_quintal, req.mandi_name, req.quantity_sold
        ))
        conn.commit()
        return {"success": True, "message": "Community trade recorded successfully"}
    finally:
        conn.close()


@router.get("/prices")
def get_prices(
    authorization: str = Header(None),
    district: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
):
    """Get market prices across mandis, supporting single crop all-cities filtering and clean default overview."""
    
    # 1. If a specific crop is selected, return all major big cities' rates for that crop
    if crop and crop.capitalize() in CROP_BASE_PRICES:
        crop_clean = crop.capitalize()
        cfg = CROP_BASE_PRICES[crop_clean]
        base_qtl = cfg["base_qtl"]

        city_rates = []
        for mandi in CITY_MANDIS:
            mod = CITY_PRICE_MODIFIERS.get(mandi["city"], 1.0)
            price_qtl = int(round((base_qtl * mod) / 10) * 10)
            prev_price = int(round((price_qtl * 0.97) / 10) * 10)
            price_kg = int(round(price_qtl / 100))

            change_pct = round(((price_qtl - prev_price) / prev_price) * 100, 1)

            city_rates.append({
                "crop_name": crop_clean,
                "variety": cfg["variety"],
                "emoji": cfg["emoji"],
                "city": mandi["city"],
                "market": mandi["market"],
                "state": mandi["state"],
                "distance": mandi["distance"],
                "price": price_qtl,
                "price_per_kg": price_kg,
                "prev_price": prev_price,
                "change_pct": change_pct,
                "is_up": change_pct >= 0,
                "unit": "quintal",
                "daily_volume": cfg["vol"],
                "demand": "High Demand 🔥" if mod >= 1.03 else ("Stable 🟢" if mod >= 0.98 else "Moderate 🟡"),
                "price_date": "Today, 11:30 AM",
            })

        # Sort by price descending (highest paying market on top)
        city_rates.sort(key=lambda x: x["price"], reverse=True)

        return {
            "success": True,
            "is_single_crop": True,
            "selected_crop": crop_clean,
            "total_cities": len(city_rates),
            "prices": city_rates,
        }

    # 2. Default Overview: Return clean realistic prices across all major crops & mandis
    return {
        "success": True,
        "is_single_crop": False,
        "farmer_district": district or "Nagpur",
        "prices": DEFAULT_ALL_CROPS,
    }


@router.get("/all-crops")
def get_all_crops():
    """Returns all available crops for the top filter bar"""
    crops = [
        {"name": "Tomato", "label": "Tomato (टोमॅटो)", "emoji": "🍅"},
        {"name": "Cotton", "label": "Cotton (कापूस)", "emoji": "🌿"},
        {"name": "Soybean", "label": "Soybean (सोयाबीन)", "emoji": "🌱"},
        {"name": "Wheat", "label": "Wheat (गहू)", "emoji": "🌾"},
        {"name": "Chilli", "label": "Chilli (मिरची)", "emoji": "🌶️"},
        {"name": "Onion", "label": "Onion (कांदा)", "emoji": "🧅"},
        {"name": "Gram", "label": "Gram / Chana (हरभरा)", "emoji": "🫘"},
        {"name": "Rice", "label": "Paddy / Rice (धान)", "emoji": "🍚"},
        {"name": "Orange", "label": "Orange (संत्रा)", "emoji": "🍊"},
        {"name": "Tur", "label": "Tur / Arhar (तूर)", "emoji": "🥣"},
        {"name": "Maize", "label": "Maize / Corn (मका)", "emoji": "🌽"},
    ]
    return {"crops": crops}
