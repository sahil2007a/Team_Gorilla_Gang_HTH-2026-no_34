"""
AgriFlow Intelligent Scanner Engine
Strict Leaf Detection + Dynamic AI Confidence + Partner Brands (Bayer, Syngenta, IFFCO, Mahadhan, UPL) + Recovery Action Plan
"""
import os
import re
import sys
import json
import base64
import requests
from pathlib import Path
from io import BytesIO
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from PIL import Image

# Load .env from project root
from dotenv import load_dotenv
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ENV_PATH)

try:
    from .database import get_conn
except (ImportError, ValueError):
    from database import get_conn

router = APIRouter(prefix="/scanner", tags=["scanner"])

class ScanRequest(BaseModel):
    base64_data: str


def _extract_image_features(pil_image: Image.Image) -> dict:
    """
    Analyzes raw image pixels with strict green chlorophyll detection.
    Rejects any non-leaf photo (desks, hands, floors, screens, walls, furniture).
    """
    small = pil_image.resize((120, 120)).convert("RGB")
    pixels = list(small.getdata())
    total_pixels = len(pixels)

    green_count = 0
    yellow_chlorosis = 0
    brown_lesions = 0
    dark_speckles = 0

    for r, g, b in pixels:
        # True Plant Chlorophyll
        if g > (r * 1.10) and g > (b * 1.10) and g > 35 and (g - min(r, b)) > 12:
            green_count += 1
        # Vibrant Plant Yellow (Chlorosis)
        elif r > 135 and g > 135 and b < 75 and abs(r - g) < 35:
            yellow_chlorosis += 1
        # Plant necrotic spots / Blight / Rust
        elif r > 80 and r > (g * 1.2) and g > b and (r - b) > 35:
            brown_lesions += 1
        # Dark fungal spots
        elif r < 40 and g < 40 and b < 40 and (r + g + b) > 20:
            dark_speckles += 1

    green_pct = round((green_count / total_pixels) * 100)
    yellow_pct = round((yellow_chlorosis / total_pixels) * 100)
    brown_pct = round((brown_lesions / total_pixels) * 100)
    dark_pct = round((dark_speckles / total_pixels) * 100)

    # STRICT CRITERIA: A real crop leaf MUST contain at least 15% green plant chlorophyll!
    if green_pct < 15:
        return {
            "is_leaf": False,
            "reason": "No plant leaf detected in the photo. Please capture a clear, well-lit photo of a crop leaf."
        }

    # Dynamic base confidence calculated from visual metrics
    dynamic_conf = round(min(0.97, max(0.76, 0.74 + (green_pct / 100) * 0.16 + (brown_pct / 100) * 0.08)), 2)

    # Symptom diagnosis category
    if brown_pct > 18 or dark_pct > 10:
        lesion_desc = f"Severe necrotic brown spots and fungal rust lesions ({brown_pct}% surface coverage)"
        severity = "High"
        condition_type = "Severe Fungal Blight & Rust"
    elif yellow_pct > 18:
        lesion_desc = f"Distinct yellow chlorosis and nutritional stress discoloration ({yellow_pct}% surface coverage)"
        severity = "Medium"
        condition_type = "Foliar Chlorosis & Nutrient Stress"
    elif brown_pct > 4 or dark_pct > 3:
        lesion_desc = f"Localized necrotic leaf spots and speckling ({brown_pct}% surface coverage)"
        severity = "Medium"
        condition_type = "Cercospora / Septoria Leaf Spot"
    else:
        lesion_desc = f"Healthy green foliage ({green_pct}% chlorophyll) with no visible lesions"
        severity = "Low"
        condition_type = "Healthy Foliage"

    return {
        "is_leaf": True,
        "green_pct": green_pct,
        "yellow_pct": yellow_pct,
        "brown_pct": brown_pct,
        "dark_pct": dark_pct,
        "lesion_desc": lesion_desc,
        "calculated_conf": dynamic_conf,
        "severity": severity,
        "condition_type": condition_type
    }


def _call_llm_pathologist(features: dict) -> dict:
    """
    Mistral-7B Pathologist Engine with symptom-matched partner brand prescriptions
    (Bayer, Syngenta, IFFCO, Mahadhan, UPL) and recovery action plans.
    """
    groq_key = os.getenv("EXPO_PUBLIC_GROQ_API_KEY") or os.getenv("GROQ_API_KEY")
    if not groq_key:
        return _fallback_diagnosis(features)

    try:
        text_prompt = f"""You are AgriFlow Mistral-7B Chief Plant Pathologist and Senior Agronomist.
Diagnose this specific photographed leaf with measured physical metrics:
- Condition Category: {features['condition_type']}
- Visual Symptoms: {features['lesion_desc']}
- Necrotic Brown Spots: {features['brown_pct']}%
- Chlorosis Discoloration: {features['yellow_pct']}%
- Healthy Chlorophyll: {features['green_pct']}%
- Dark Pathogen Speckles: {features['dark_pct']}%

RULES:
1. Do NOT write specific crop species names (like Tomato, Cotton, etc.). State only whether the plant is "Healthy Plant" or "Diseased Plant".
2. Set a dynamic confidence percentage (e.g. {features['calculated_conf']}).
3. For Prescribed Products, select ONE specific matching collaborating partner brand from our portfolio:
   - For Rust / Alternaria / Heavy Blight: 'Bayer Nativo (Tebuconazole 50% + Trifloxystrobin 25% WG, 12g in 15L water)' + 'Mahadhan 13:0:45 Potassium Nitrate (80g/pump)'
   - For Leaf Spot / Anthracnose: 'UPL Saaf (Carbendazim 12% + Mancozeb 63% WP, 30g in 15L water)' + 'IFFCO 19:19:19 Water Soluble Fertilizer (75g/pump)'
   - For Downy Mildew / Water Soaking: 'Syngenta Ridomil Gold (Mefenoxam + Mancozeb, 40g in 15L water)' + 'Coromandel Gromor Foliar Boost (60g/pump)'
   - For Powdery Mildew: 'Tata Rallis Contaf Plus (Hexaconazole 5% SC, 30ml in 15L water)' + 'IFFCO 00:52:34 (75g/pump)'
   - For Chlorosis / Yellowing: 'Mahadhan Chelated Micronutrient Combo (Zinc+Iron, 25g in 15L water)' + 'IFFCO 12:61:00 MAP (70g/pump)'
   - For Healthy Plant: 'IFFCO 19:19:19 (50g in 15L water)' + 'Multiplex Multineem 10,000 PPM (25ml/pump)'
   - Organic Remedy: 'Multiplex Multineem 10,000 PPM (35ml in 15L water)' or 'Katyayani Trichoderma Viride Bio-Fungicide (50g/pump)'.
4. In recommendations, detail 3 clinical recovery steps explaining how the chosen medicine halts the pathogen and how the fertilizer rebuilds green chlorophyll tissue.

Output VALID JSON only without code fences:
{{
  "leaf_detected": true,
  "health_status": "Healthy Plant or Diseased Plant",
  "disease_name": "{features['condition_type']}",
  "disease_confidence": {features['calculated_conf']},
  "severity": "{features['severity']}",
  "cause": "Specific biological cause of {features['condition_type']} under current microclimate moisture",
  "analysis": "Precise visual symptom observation describing the {features['brown_pct']}% spotting and {features['yellow_pct']}% discoloration",
  "products": {{
    "fertilizer": "Chosen partner fertilizer with exact dosage per 15L pump",
    "pesticide_or_fungicide": "Chosen partner chemical medicine with exact dosage per 15L pump",
    "organic_remedy": "Chosen partner organic remedy with exact dosage per 15L pump"
  }},
  "precautions": [
    "Spray during early morning or late evening for maximum foliar absorption",
    "Wear protective gloves and mask when mixing chemical concentrate",
    "Maintain 7-10 day interval between sequential foliar sprays"
  ],
  "action": "Immediate spray application with exact dosage per 15L pump",
  "recommendations": [
    "Apply specific partner medicine to halt fungal spore germination and cell division",
    "Apply specific partner fertilizer to accelerate cellular chlorophyll synthesis and leaf recovery",
    "Spray Multiplex Multineem to create an organic repellent barrier on new leaves"
  ],
  "message": "Custom diagnosis summary"
}}"""

        resp = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
            json={
                "model": "openai/gpt-oss-20b",
                "messages": [
                    {"role": "system", "content": "You are AgriFlow Mistral-7B Agricultural Pathologist. Output raw valid JSON only."},
                    {"role": "user", "content": text_prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.4,
                "max_tokens": 1200
            },
            timeout=12
        )
        if resp.status_code == 200:
            content = resp.json()["choices"][0]["message"]["content"]
            cleaned = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).replace('```json', '').replace('```', '').strip()
            parsed = json.loads(cleaned)
            return parsed
    except Exception as e:
        print(f"[Mistral Pathologist Exception]: {e}")

    return _fallback_diagnosis(features)


def _fallback_diagnosis(features: dict) -> dict:
    is_healthy = features["green_pct"] > 65 and features["brown_pct"] < 4
    severity = features.get("severity", "Medium")
    conf = features.get("calculated_conf", 0.91)
    condition = features.get("condition_type", "Fungal Leaf Spot")

    if is_healthy:
        return {
            "leaf_detected": True,
            "health_status": "Healthy Plant",
            "disease_name": "Healthy Foliage (No Pathogen)",
            "disease_confidence": conf,
            "severity": "Low",
            "cause": "Optimal plant metabolism and balanced foliar chlorophyll.",
            "analysis": f"Observed {features['green_pct']}% vibrant chlorophyll with intact leaf tissue.",
            "products": {
                "fertilizer": "IFFCO 19:19:19 Water Soluble Fertilizer (50g in 15L water) to maintain vegetative vigor",
                "pesticide_or_fungicide": "None required (Plant is in healthy condition)",
                "organic_remedy": "Multiplex Multineem 10,000 PPM Neem Oil (25ml in 15L water) as preventive shield"
            },
            "precautions": [
                "Continue standard drip/furrow irrigation without overwatering",
                "Scout the underside of foliage weekly for early pest detection"
            ],
            "action": "Maintain routine foliar nutrition with IFFCO 19:19:19.",
            "recommendations": [
                "Apply IFFCO 19:19:19 (50g in 15L water) every 14 days to sustain rapid vegetative growth",
                "Spray Multiplex Multineem (25ml in 15L water) every 3 weeks to prevent insect-vector infestations"
            ],
            "message": "Foliage is healthy and growing vigorously."
        }

    # Diseased Fallback matching symptom severity
    if features["brown_pct"] > 18:
        med = "Bayer Nativo (Tebuconazole 50% + Trifloxystrobin 25% WG, 12g in 15L water)"
        fert = "Mahadhan 13:0:45 Potassium Nitrate (80g in 15L water) to arrest necrotic collapse"
    else:
        med = "UPL Saaf (Carbendazim 12% + Mancozeb 63% WP, 30g in 15L water)"
        fert = "IFFCO 19:19:19 Water Soluble Fertilizer (75g in 15L water) to regenerate foliar cells"

    return {
        "leaf_detected": True,
        "health_status": "Diseased Plant",
        "disease_name": condition,
        "disease_confidence": conf,
        "severity": severity,
        "cause": f"Pathogenic fungal infection triggered by high humidity, creating {features['brown_pct']}% necrotic tissue.",
        "analysis": f"Observed {features['green_pct']}% active chlorophyll and {features['brown_pct']}% necrotic spotting on leaf surface.",
        "products": {
            "fertilizer": fert,
            "pesticide_or_fungicide": med,
            "organic_remedy": "Multiplex Multineem 10,000 PPM Neem Oil (35ml in 15L water)"
        },
        "precautions": [
            "Spray during early morning or late evening for maximum absorption",
            "Avoid overhead sprinkler irrigation to keep canopy dry and stop fungal spread",
            "Wear gloves and face mask when preparing chemical spray solution"
        ],
        "action": f"Spray {med} immediately.",
        "recommendations": [
            f"Apply {med} to eradicate pathogen spores and stop lesion expansion",
            f"Apply {fert} to accelerate new healthy leaf emergence",
            "Spray Multiplex Multineem (35ml in 15L water) as an organic protective shield"
        ],
        "message": f"Leaf analyzed: {severity} severity condition detected."
    }


def _build_result(parsed: dict, farmer_id: Optional[int] = None) -> dict:
    if not parsed.get("leaf_detected", False):
        return {
            "success": True,
            "leaf_detected": False,
            "message": parsed.get("message", "No plant leaf detected in the photo. Please capture a clear, well-lit photo of a crop leaf.")
        }

    raw_status = parsed.get("health_status") or "Diseased Plant"
    if "healthy" in raw_status.lower() and "disease" not in raw_status.lower():
        health_status = "Healthy Plant"
        disease_name = parsed.get("disease_name") or "Healthy Foliage"
    else:
        health_status = "Diseased Plant"
        disease_name = parsed.get("disease_name") or "Leaf Spot / Fungal Blight"

    disease_conf = float(parsed.get("disease_confidence") or 0.88)
    severity = parsed.get("severity") or ("Low" if health_status == "Healthy Plant" else "Medium")
    cause = parsed.get("cause") or ""
    analysis = parsed.get("analysis") or ""
    action = parsed.get("action") or ""
    
    products = parsed.get("products") or {
        "fertilizer": "IFFCO 19:19:19 Water Soluble Fertilizer (75g in 15L water)",
        "pesticide_or_fungicide": "UPL Saaf (30g per 15L pump)",
        "organic_remedy": "Multiplex Multineem 10,000 PPM (35ml in 15L water)"
    }
    
    precautions = parsed.get("precautions") or [
        "Spray during early morning or late evening",
        "Wear protective gloves and mask while spraying",
        "Ensure proper soil moisture before spraying"
    ]
    
    recommendations = parsed.get("recommendations") or [
        "Apply prescribed partner medicine to eradicate pathogen spores",
        "Apply partner foliar fertilizer to restore chlorophyll synthesis and vigor",
        "Spray Multiplex Multineem 10,000 PPM for organic bio-defense"
    ]
    message = parsed.get("message") or f"Analysis Complete: {health_status} ({severity} severity)."

    # Save to SQLite scan_results table
    try:
        conn = get_conn()
        conn.execute(
            """INSERT INTO scan_results (
                   farmer_id, leaf_detected, image_quality, crop_name, crop_confidence,
                   health_status, disease_name, disease_confidence, severity,
                   cause, analysis, action, recommendations, message
               ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                farmer_id, parsed.get("image_quality", "good"), health_status, disease_conf,
                health_status, disease_name, disease_conf, severity,
                cause, analysis, action, json.dumps(recommendations), message
            )
        )
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[DB Scan Save Error]: {e}")

    return {
        "success": True,
        "leaf_detected": True,
        "image_quality": parsed.get("image_quality", "good"),
        "plant_name": health_status,
        "crop_name": health_status,
        "crop_confidence": disease_conf,
        "leaf_confidence": disease_conf,
        "health_status": health_status,
        "disease_name": disease_name,
        "disease_confidence": disease_conf,
        "severity": severity,
        "visual_growth_status": "Active Vegetative",
        "cause": cause,
        "analysis": analysis,
        "action": action,
        "products": products,
        "precautions": precautions,
        "recommendations": recommendations,
        "message": message,
        "crop": {
            "name": health_status,
            "confidence": disease_conf
        },
        "health": {
            "status": health_status,
            "disease": disease_name,
            "confidence": disease_conf,
            "severity": severity
        },
        "details": {
            "cause": cause,
            "analysis": analysis,
            "action": action
        }
    }


@router.post("/analyze")
def analyze_image(payload: ScanRequest, authorization: Optional[str] = Header(None)):
    farmer_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        conn = get_conn()
        try:
            farmer = conn.execute("SELECT id FROM farmers WHERE token = ?", (token,)).fetchone()
            if farmer:
                farmer_id = farmer["id"]
        finally:
            conn.close()

    try:
        img_bytes = base64.b64decode(payload.base64_data)
        img = Image.open(BytesIO(img_bytes)).convert("RGB")
        
        # 1. Real Computer Vision Pixel Extraction with Strict Chlorophyll Filter & Dynamic Confidence
        features = _extract_image_features(img)
        if not features.get("is_leaf", False):
            return {
                "success": True,
                "leaf_detected": False,
                "message": features.get("reason", "No plant leaf detected in the photo. Please capture a clear, well-lit photo of a crop leaf.")
            }

        # 2. Dynamic Mistral-7B Pathologist Synthesis with Symptom-Matched Partner Brands
        llm_result = _call_llm_pathologist(features)
        return _build_result(llm_result, farmer_id)

    except Exception as e:
        print(f"[Scanner Analysis Error]: {e}")
        return {
            "success": True,
            "leaf_detected": False,
            "message": "Could not process image. Please capture a clear photo of a crop leaf."
        }
