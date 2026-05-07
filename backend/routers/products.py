import logging
import time

from fastapi import APIRouter, Depends, HTTPException

from config import DATA_SOURCE
from providers.base import ProductProvider
from providers.shopify import ShopifyProductAdapter

router = APIRouter(prefix="/products", tags=["products"])
logger = logging.getLogger("price_checker.products")

# ── Caché en memoria ──────────────────────────────────────────────────────────
CACHE_TTL_SECONDS = 15 * 60  # 15 minutos
_product_cache: dict[str, tuple[dict, float]] = {}  # barcode → (data, expires_at)


def _cache_get(barcode: str) -> dict | None:
    entry = _product_cache.get(barcode)
    if entry and time.time() < entry[1]:
        return entry[0]
    if entry:
        del _product_cache[barcode]
    return None


def _cache_set(barcode: str, data: dict) -> None:
    _product_cache[barcode] = (data, time.time() + CACHE_TTL_SECONDS)

# ─────────────────────────────────────────────────────────────────────────────


def get_provider() -> ProductProvider:
    """
    Factoría de proveedores — lee DATA_SOURCE y devuelve el adaptador correcto.
    Añadir nuevos adaptadores aquí sin tocar el router.
    """
    if DATA_SOURCE == "shopify":
        return ShopifyProductAdapter()
    # Ejemplos futuros:
    # if DATA_SOURCE == "odoo":
    #     from providers.odoo import OdooProductAdapter
    #     return OdooProductAdapter()
    raise HTTPException(status_code=500, detail=f"DATA_SOURCE no soportado: {DATA_SOURCE}")


@router.get("/{barcode}")
async def get_product(barcode: str, provider: ProductProvider = Depends(get_provider)):
    start = time.time()

    cached = _cache_get(barcode)
    if cached:
        ms = round((time.time() - start) * 1000)
        logger.info("CACHE HIT  barcode=%s (%dms)", barcode, ms)
        return cached

    try:
        result = await provider.get_product(barcode)
        _cache_set(barcode, result)
        ms = round((time.time() - start) * 1000)
        logger.info("PROVIDER=%s barcode=%s name=%r (%dms)", DATA_SOURCE, barcode, result.get("name"), ms)
        return result
    except HTTPException as e:
        ms = round((time.time() - start) * 1000)
        if e.status_code == 404:
            logger.warning("NOT FOUND  barcode=%s (%dms)", barcode, ms)
        else:
            logger.error("ERROR      barcode=%s status=%s detail=%s (%dms)", barcode, e.status_code, e.detail, ms)
        raise
