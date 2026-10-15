"""
Adaptador de Google Sheets — implementa ProductProvider leyendo datos de un Google Sheet público.

El Google Sheet debe tener 2 hojas generadas por el AppScript:
  - "Productos": handle, title, vendor, type, option1_name, option1_value,
                 option2_name, option2_value, variant_sku, variant_price,
                 variant_compare_at_price, variant_barcode, image_src, image_alt_text
  - "Inventario": handle, option1_value, option2_value, sku, location, available

Requisito: El Google Sheet debe estar compartido como "Anyone with the link can view".
"""

import logging
import time
import httpx
from fastapi import HTTPException
from providers.base import ProductProvider, resolve_prices
from config import BrandConfig

logger = logging.getLogger("price_checker.gsheets")

# ── Caché en memoria del Sheet completo ──────────────────────────────────────
# Se cachea el Sheet entero para evitar requests en cada consulta.
# Se refresca cada CACHE_TTL_SECONDS.

CACHE_TTL_SECONDS = 10 * 60  # 10 minutos

_sheet_cache: dict[str, dict] = {}
# brand → { "products": [...], "inventory": [...], "expires_at": float }


def _gsheet_csv_url(sheet_id: str, sheet_name: str) -> str:
    """Genera la URL para descargar una hoja del Google Sheet como CSV."""
    import urllib.parse
    encoded = urllib.parse.quote(sheet_name)
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={encoded}"


async def _fetch_sheet_csv(sheet_id: str, sheet_name: str, required_column: str) -> list[dict]:
    """Descarga una hoja del Google Sheet como CSV y la parsea a lista de dicts."""
    import csv
    import io

    url = _gsheet_csv_url(sheet_id, sheet_name)
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=30, follow_redirects=True)

    if response.status_code != 200:
        logger.error("GSheets fetch failed: sheet=%s status=%s", sheet_name, response.status_code)
        raise HTTPException(status_code=502, detail=f"No se pudo leer la hoja '{sheet_name}' del Google Sheet.")

    reader = csv.DictReader(io.StringIO(response.text))
    rows = list(reader)
    # Hoja privada / renombrada: Google puede responder 200 con HTML u otra hoja; no cachear eso como "catálogo vacío".
    if required_column not in (reader.fieldnames or []):
        logger.error("GSheets fetch: hoja '%s' sin columna '%s' (compartición revocada o hoja renombrada?)", sheet_name, required_column)
        raise HTTPException(status_code=502, detail=f"La hoja '{sheet_name}' del Google Sheet no tiene el formato esperado.")
    return rows


async def _get_cached_data(cfg: BrandConfig) -> dict:
    """Devuelve los datos del Sheet, usando caché si es válido."""
    now = time.time()
    cached = _sheet_cache.get(cfg.brand)
    if cached and now < cached["expires_at"]:
        return cached

    logger.info("GSheets [%s] refrescando caché...", cfg.brand)
    products = await _fetch_sheet_csv(cfg.gsheet_id, "Productos", "variant_barcode")
    inventory = await _fetch_sheet_csv(cfg.gsheet_id, "Inventario", "sku")

    # Indexar productos por barcode para búsqueda rápida
    barcode_index: dict[str, list[dict]] = {}
    for row in products:
        bc = row.get("variant_barcode", "").strip()
        if bc:
            barcode_index.setdefault(bc, []).append(row)

    # Indexar inventario por handle Y por sku para búsqueda rápida
    inventory_by_handle: dict[str, list[dict]] = {}
    inventory_by_sku: dict[str, list[dict]] = {}
    for row in inventory:
        handle = row.get("handle", "").strip()
        sku = row.get("sku", "").strip()
        if handle:
            inventory_by_handle.setdefault(handle, []).append(row)
        if sku:
            inventory_by_sku.setdefault(sku, []).append(row)

    data = {
        "products": products,
        "inventory": inventory,
        "barcode_index": barcode_index,
        "inventory_by_handle": inventory_by_handle,
        "inventory_by_sku": inventory_by_sku,
        "expires_at": now + CACHE_TTL_SECONDS,
    }
    _sheet_cache[cfg.brand] = data
    logger.info("GSheets [%s] caché listo: %d productos, %d inv rows", cfg.brand, len(products), len(inventory))
    return data


class GoogleSheetsProductAdapter(ProductProvider):
    """
    Adaptador que implementa ProductProvider leyendo de un Google Sheet.
    Requiere que el Sheet esté compartido públicamente (view only).
    """

    def __init__(self, brand_cfg: BrandConfig) -> None:
        self.brand_cfg = brand_cfg

    async def get_product(self, barcode: str) -> dict:
        data = await _get_cached_data(self.brand_cfg)

        # Buscar variante por barcode
        variants = data["barcode_index"].get(barcode)
        if not variants:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        variant = variants[0]
        handle = variant.get("handle", "")
        variant_sku = variant.get("variant_sku", "").strip()

        # Obtener todas las variantes del mismo producto (mismo handle)
        same_product = []
        for bc_variants in data["barcode_index"].values():
            for v in bc_variants:
                if v.get("handle") == handle:
                    same_product.append(v)

        # Deducir el nombre de la opción de talla
        option1_name = variant.get("option1_name", "")
        option2_name = variant.get("option2_name", "")

        # Determinar cuál opción es "talla" y cuál es "color"
        size_option = None
        color = None
        size = None
        if option1_name and option1_name.lower() != "color" and option1_name.lower() != "title":
            size_option = "option1_value"
            size = variant.get("option1_value", "")
            if option2_name:
                color = variant.get("option2_value", "")
        elif option2_name and option2_name.lower() != "color":
            size_option = "option2_value"
            size = variant.get("option2_value", "")
            color = variant.get("option1_value", "")
        elif option1_name and option1_name.lower() == "title":
            size_option = None
            size = None

        # Recopilar tallas y verificar stock usando SKU como key de matching
        all_sizes = []
        available_sizes = []
        seen_sizes = set()

        for v in same_product:
            v_size = v.get(size_option, "") if size_option else None
            if not v_size or v_size in seen_sizes:
                continue
            seen_sizes.add(v_size)
            all_sizes.append(v_size)

            # Buscar inventario por SKU de esta variante
            v_sku = v.get("variant_sku", "").strip()
            v_barcode = v.get("variant_barcode", "").strip()
            inv_key = v_sku or v_barcode
            inv_rows_for_variant = data["inventory_by_sku"].get(inv_key, [])

            has_stock = any(
                int(inv.get("available", "0")) > 0
                for inv in inv_rows_for_variant
                if inv.get("available", "0").lstrip("-").isdigit()
            )
            if has_stock:
                available_sizes.append(v_size)

        # Stock de la variante escaneada (por sucursal)
        scanned_key = variant_sku or barcode
        scanned_inv = data["inventory_by_sku"].get(scanned_key, [])
        stock = [
            {
                "location_id": inv.get("location", ""),
                "location_name": inv.get("location", ""),
                "available": int(inv.get("available", "0")) if inv.get("available", "0").lstrip("-").isdigit() else 0,
            }
            for inv in scanned_inv
        ]

        # Stock por talla (todas las variantes del mismo producto)
        stock_by_size = []
        for v in same_product:
            v_size = v.get(size_option, "") if size_option else None
            if not v_size:
                continue
            v_sku = v.get("variant_sku", "").strip()
            v_barcode = v.get("variant_barcode", "").strip()
            inv_key = v_sku or v_barcode
            for inv in data["inventory_by_sku"].get(inv_key, []):
                try:
                    qty = int(inv.get("available", "0"))
                except ValueError:
                    qty = 0
                stock_by_size.append({
                    "size": v_size,
                    "location_id": inv.get("location", ""),
                    "location_name": inv.get("location", ""),
                    "available": qty,
                })

        # Imágenes: recopilar de todas las variantes del producto
        images = []
        seen_imgs = set()
        for v in same_product:
            img = v.get("image_src", "").strip()
            if img and img not in seen_imgs:
                seen_imgs.add(img)
                images.append(img)

        # Precio
        try:
            price = float(variant.get("variant_price", "0"))
        except ValueError:
            price = 0.0

        price, price_sale = resolve_prices(price, variant.get("variant_compare_at_price", ""))

        return {
            "name": variant.get("title", ""),
            "sku": variant.get("variant_sku") or None,
            "price": price,
            "priceSale": price_sale,
            "vendor": variant.get("vendor", ""),
            "category": variant.get("type", ""),
            "subcategory": None,
            "color": color,
            "size": size,
            "size_option_name": option1_name if size_option == "option1_value" else option2_name if size_option else None,
            "images": images,
            "all_sizes": all_sizes,
            "available_sizes": available_sizes,
            "stock": stock,
            "stock_by_size": stock_by_size,
            "metafields": {},
        }
