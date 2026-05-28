import os
from dataclasses import dataclass
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

SHOPIFY_API_VERSION = os.getenv("SHOPIFY_API_VERSION", "2026-04")
DATA_SOURCE         = os.getenv("DATA_SOURCE", "shopify")  # default global, puede ser overridden por marca


# ── Credenciales por marca ────────────────────────────────────────────────────

@dataclass(frozen=True)
class BrandConfig:
    brand:         str
    client_id:     str
    client_secret: str
    domain:        str
    api_version:   str
    location_pins: dict  # location_id → pin
    data_source:   str = ""  # override por marca: "shopify" | "gsheets" (vacío = usa DATA_SOURCE global)
    gsheet_id:     str = ""  # ID del Google Sheet (solo si data_source == "gsheets")
    # ── TEMPORAL: token estático (shpat_) para marcas sin credenciales OAuth ──
    # Eliminar este campo cuando todas las marcas tengan client_id/client_secret
    static_token:  str = ""


def _load_pins(env_var: str) -> dict:
    raw = os.getenv(env_var, "")
    pins: dict = {}
    for entry in raw.split(","):
        entry = entry.strip()
        if ":" in entry:
            location_id, pin = entry.rsplit(":", 1)
            pins[location_id.strip()] = pin.strip()
    return pins


def _make_brand(brand: str, id_var: str, secret_var: str, domain_var: str, pins_var: str,
                 token_var: str = "", data_source: str = "", gsheet_id_var: str = "") -> BrandConfig:
    return BrandConfig(
        brand=brand,
        client_id=os.getenv(id_var, ""),
        client_secret=os.getenv(secret_var, ""),
        domain=os.getenv(domain_var, ""),
        api_version=SHOPIFY_API_VERSION,
        location_pins=_load_pins(pins_var),
        data_source=data_source,
        gsheet_id=os.getenv(gsheet_id_var, "") if gsheet_id_var else "",
        # ── TEMPORAL: leer token estático si existe ──
        static_token=os.getenv(token_var, "") if token_var else "",
    )


_BRANDS: dict[str, BrandConfig] = {
    "wb":      _make_brand("wb",      "SHOPIFY_WB_ID",      "SHOPIFY_WB_SECRET",      "SHOPIFY_WB_DOMAIN",      "LOCATION_PINS_WB"),
    "stetson": _make_brand("stetson", "SHOPIFY_STETSON_ID", "SHOPIFY_STETSON_SECRET", "SHOPIFY_STETSON_DOMAIN", "LOCATION_PINS_STETSON"),
    # Ariat usa Google Sheets como fuente de datos (sin acceso a Shopify GraphQL)
    "ariat":   _make_brand("ariat",   "SHOPIFY_ARIAT_ID",   "SHOPIFY_ARIAT_SECRET",   "SHOPIFY_ARIAT_DOMAIN",   "LOCATION_PINS_ARIAT",
                           token_var="SHOPIFY_ARIAT_TOKEN", data_source="gsheets", gsheet_id_var="GSHEET_ARIAT_ID"),
}


def get_brand_config(brand: str) -> BrandConfig:
    cfg = _BRANDS.get(brand.lower())
    if not cfg:
        raise HTTPException(status_code=400, detail="Marca no reconocida.")
    # Validar credenciales según el data source de la marca
    effective_source = cfg.data_source or DATA_SOURCE
    if effective_source == "gsheets":
        if not cfg.gsheet_id:
            raise HTTPException(status_code=503, detail=f"GSHEET_ID de '{brand}' no configurado.")
    else:
        # ── TEMPORAL: permitir marcas con static_token aunque no tengan client_id ──
        has_oauth  = cfg.client_id and cfg.client_secret
        has_static = bool(cfg.static_token)
        if not cfg.domain or (not has_oauth and not has_static):
            raise HTTPException(status_code=503, detail=f"Credenciales de '{brand}' no configuradas en el servidor.")
    return cfg
