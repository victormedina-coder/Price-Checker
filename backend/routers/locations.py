from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from shopify.client import shopify_query
from shopify.querys import LOCATIONS_QUERY
from config import get_brand_config

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("")
async def get_locations(x_brand: str = Header(default="")):
    if not x_brand:
        raise HTTPException(status_code=400, detail="Header 'X-Brand' requerido.")
    brand_cfg = get_brand_config(x_brand)
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
def auth_location(req: AuthRequest, x_brand: str = Header(default="")):
    if not x_brand:
        raise HTTPException(status_code=400, detail="Header 'X-Brand' requerido.")
    brand_cfg = get_brand_config(x_brand)
    expected_pin = brand_cfg.location_pins.get(req.location_id)
    if expected_pin is None:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada.")
    if req.pin != expected_pin:
        raise HTTPException(status_code=401, detail="PIN incorrecto.")
    return {"success": True, "location_id": req.location_id}
