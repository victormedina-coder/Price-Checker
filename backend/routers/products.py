import logging
import re
import time

from cachetools import TTLCache
from fastapi import APIRouter, Depends, HTTPException, Header

from config import DATA_SOURCE, get_brand_config, BrandConfig
from providers.base import ProductProvider
from providers.shopify import ShopifyProductAdapter
from providers.gsheets import GoogleSheetsProductAdapter

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger("price_checker.products")

# ── Validación de barcode (previene inyección en queries de Shopify) ──────────
_BARCODE_RE = re.compile(r"^[A-Za-z0-9\-]{1,50}$")

# ── Caché en memoria (máximo 1000 entradas, TTL 15 min) ──────────────────────
CACHE_TTL_SECONDS = 15 * 60  # 15 minutos
_product_cache: TTLCache = TTLCache(maxsize=1000, ttl=CACHE_TTL_SECONDS)


def _cache_get(key: str) -> dict | None:
    return _product_cache.get(key)


def _cache_set(key: str, data: dict) -> None:
    _product_cache[key] = data

# ─────────────────────────────────────────────────────────────────────────────


def get_provider(brand_cfg: BrandConfig) -> ProductProvider:
    """
    Factoría de proveedores — devuelve el adaptador correcto.
    Usa el data_source de la marca si existe, si no usa el DATA_SOURCE global.
    """
    source = brand_cfg.data_source or DATA_SOURCE
    if source == "shopify":
        return ShopifyProductAdapter(brand_cfg)
    if source == "gsheets":
        return GoogleSheetsProductAdapter(brand_cfg)
    raise HTTPException(status_code=500, detail=f"DATA_SOURCE no soportado: {source}")


@router.get("/{barcode}")
async def get_product(barcode: str, x_brand: str = Header(default="")):
    if not x_brand:
        raise HTTPException(status_code=400, detail="Header 'X-Brand' requerido.")
    if not _BARCODE_RE.match(barcode):
        raise HTTPException(status_code=400, detail="Código de barras inválido.")

    brand_cfg = get_brand_config(x_brand)
    provider  = get_provider(brand_cfg)
    cache_key = f"{brand_cfg.brand}:{barcode}"
    start     = time.time()

    cached = _cache_get(cache_key)
    if cached:
        ms = round((time.time() - start) * 1000)
        logger.info("CACHE HIT  brand=%s barcode=%s (%dms)", brand_cfg.brand, barcode, ms)
        return cached

    try:
        result = await provider.get_product(barcode)
        _cache_set(cache_key, result)
        ms = round((time.time() - start) * 1000)
        source = brand_cfg.data_source or DATA_SOURCE
        logger.info("PROVIDER=%s brand=%s barcode=%s name=%r (%dms)", source, brand_cfg.brand, barcode, result.get("name"), ms)
        return result
    except HTTPException as e:
        ms = round((time.time() - start) * 1000)
        if e.status_code == 404:
            logger.warning("NOT FOUND  brand=%s barcode=%s (%dms)", brand_cfg.brand, barcode, ms)
        else:
            logger.error("ERROR      brand=%s barcode=%s status=%s detail=%s (%dms)", brand_cfg.brand, barcode, e.status_code, e.detail, ms)
        raise
