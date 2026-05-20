import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Header

from config import DATA_SOURCE, get_brand_config, BrandConfig
from providers.base import ProductProvider
from providers.shopify import ShopifyProductAdapter

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger("price_checker.products")

# ── Caché en memoria ──────────────────────────────────────────────────────────
CACHE_TTL_SECONDS = 15 * 60  # 15 minutos
# clave: "brand:barcode" para aislar caché por marca
_product_cache: dict[str, tuple[dict, float]] = {}


def _cache_get(key: str) -> dict | None:
    entry = _product_cache.get(key)
    if entry and time.time() < entry[1]:
        return entry[0]
    if entry:
        del _product_cache[key]
    return None


def _cache_set(key: str, data: dict) -> None:
    _product_cache[key] = (data, time.time() + CACHE_TTL_SECONDS)

# ─────────────────────────────────────────────────────────────────────────────


def get_provider(brand_cfg: BrandConfig) -> ProductProvider:
    """
    Factoría de proveedores — devuelve el adaptador correcto según DATA_SOURCE.
    """
    if DATA_SOURCE == "shopify":
        return ShopifyProductAdapter(brand_cfg)
    raise HTTPException(status_code=500, detail=f"DATA_SOURCE no soportado: {DATA_SOURCE}")


@router.get("/{barcode}")
async def get_product(barcode: str, x_brand: str = Header(default="")):
    if not x_brand:
        raise HTTPException(status_code=400, detail="Header 'X-Brand' requerido.")

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
        logger.info("PROVIDER=%s brand=%s barcode=%s name=%r (%dms)", DATA_SOURCE, brand_cfg.brand, barcode, result.get("name"), ms)
        return result
    except HTTPException as e:
        ms = round((time.time() - start) * 1000)
        if e.status_code == 404:
            logger.warning("NOT FOUND  brand=%s barcode=%s (%dms)", brand_cfg.brand, barcode, ms)
        else:
            logger.error("ERROR      brand=%s barcode=%s status=%s detail=%s (%dms)", brand_cfg.brand, barcode, e.status_code, e.detail, ms)
        raise
