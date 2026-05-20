import os
from dataclasses import dataclass
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

SHOPIFY_API_VERSION = os.getenv("SHOPIFY_API_VERSION", "2026-04")
DATA_SOURCE         = os.getenv("DATA_SOURCE", "shopify")  # shopify | odoo | netsuite


# ── Credenciales por marca ────────────────────────────────────────────────────

@dataclass(frozen=True)
class BrandConfig:
    brand:         str
    client_id:     str
    client_secret: str
    domain:        str
    api_version:   str
    location_pins: dict  # location_id → pin


def _load_pins(env_var: str) -> dict:
    raw = os.getenv(env_var, "")
    pins: dict = {}
    for entry in raw.split(","):
        entry = entry.strip()
        if ":" in entry:
            location_id, pin = entry.rsplit(":", 1)
            pins[location_id.strip()] = pin.strip()
    return pins


def _make_brand(brand: str, id_var: str, secret_var: str, domain_var: str, pins_var: str) -> BrandConfig:
    return BrandConfig(
        brand=brand,
        client_id=os.getenv(id_var, ""),
        client_secret=os.getenv(secret_var, ""),
        domain=os.getenv(domain_var, ""),
        api_version=SHOPIFY_API_VERSION,
        location_pins=_load_pins(pins_var),
    )


_BRANDS: dict[str, BrandConfig] = {
    "wb":      _make_brand("wb",      "SHOPIFY_WB_ID",      "SHOPIFY_WB_SECRET",      "SHOPIFY_WB_DOMAIN",      "LOCATION_PINS_WB"),
    "stetson": _make_brand("stetson", "SHOPIFY_STETSON_ID", "SHOPIFY_STETSON_SECRET", "SHOPIFY_STETSON_DOMAIN", "LOCATION_PINS_STETSON"),
    "ariat":   _make_brand("ariat",   "SHOPIFY_ARIAT_ID",   "SHOPIFY_ARIAT_SECRET",   "SHOPIFY_ARIAT_DOMAIN",   "LOCATION_PINS_ARIAT"),
}


def get_brand_config(brand: str) -> BrandConfig:
    cfg = _BRANDS.get(brand.lower())
    if not cfg:
        raise HTTPException(status_code=400, detail=f"Marca no reconocida: '{brand}'. Valores válidos: {list(_BRANDS)}")
    if not cfg.client_id or not cfg.domain:
        raise HTTPException(status_code=503, detail=f"Credenciales de '{brand}' no configuradas en el servidor.")
    return cfg
