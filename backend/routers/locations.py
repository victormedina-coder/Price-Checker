from fastapi import APIRouter, HTTPException, Header, Request
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from shopify.client import shopify_query
from shopify.querys import LOCATIONS_QUERY
from config import get_brand_config, DATA_SOURCE

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("")
@limiter.limit("30/minute")
async def get_locations(request: Request, x_brand: str = Header(default="")):
    if not x_brand:
        raise HTTPException(status_code=400, detail="Header 'X-Brand' requerido.")
    brand_cfg = get_brand_config(x_brand)
    source = brand_cfg.data_source or DATA_SOURCE

    # Para marcas con gsheets que tienen token de Shopify para locations
    if source == "gsheets" and brand_cfg.static_token:
        data = await shopify_query(LOCATIONS_QUERY, brand_cfg)
        return [
            {
                "id":       edge["node"]["id"],
                "name":     edge["node"]["name"],
                "city":     edge["node"]["address"]["city"],
                "province": edge["node"]["address"]["province"],
                "isActive": edge["node"]["isActive"],
            }
            for edge in data["data"]["locations"]["edges"]
            if edge["node"]["isActive"] and edge["node"]["id"] in brand_cfg.location_pins
        ]

    # Para marcas con gsheets sin token de Shopify: devolver locations desde los PINs
    if source == "gsheets":
        return [
            {
                "id":       loc_id,
                "name":     loc_id.split("/")[-1] if "/" in loc_id else loc_id,
                "city":     "",
                "province": "",
                "isActive": True,
            }
            for loc_id in brand_cfg.location_pins
        ]

    # Shopify: flujo normal
    data = await shopify_query(LOCATIONS_QUERY, brand_cfg)
    return [
        {
            "id":       edge["node"]["id"],
            "name":     edge["node"]["name"],
            "city":     edge["node"]["address"]["city"],
            "province": edge["node"]["address"]["province"],
            "isActive": edge["node"]["isActive"],
        }
        for edge in data["data"]["locations"]["edges"]
        if edge["node"]["isActive"] and edge["node"]["id"] in brand_cfg.location_pins
    ]


class AuthRequest(BaseModel):
    location_id: str
    pin: str


@router.post("/auth")
@limiter.limit("5/15minutes")
def auth_location(request: Request, req: AuthRequest, x_brand: str = Header(default="")):
    if not x_brand:
        raise HTTPException(status_code=400, detail="Header 'X-Brand' requerido.")
    brand_cfg = get_brand_config(x_brand)
    expected_pin = brand_cfg.location_pins.get(req.location_id)
    if expected_pin is None:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada.")
    if req.pin != expected_pin:
        raise HTTPException(status_code=401, detail="PIN incorrecto.")
    return {"success": True, "location_id": req.location_id}
