from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from shopify.client import shopify_query
from shopify.querys import LOCATIONS_QUERY
from config import LOCATION_PINS

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("")
async def get_locations():
    data = await shopify_query(LOCATIONS_QUERY)
    locations = [
        {
            "id":       edge["node"]["id"],
            "name":     edge["node"]["name"],
            "city":     edge["node"]["address"]["city"],
            "province": edge["node"]["address"]["province"],
            "isActive": edge["node"]["isActive"],
        }
        for edge in data["data"]["locations"]["edges"]
        if edge["node"]["isActive"]
    ]
    return locations


class AuthRequest(BaseModel):
    location_id: str
    pin: str


@router.post("/auth")
def auth_location(req: AuthRequest):
    expected_pin = LOCATION_PINS.get(req.location_id)
    if expected_pin is None:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada.")
    if req.pin != expected_pin:
        raise HTTPException(status_code=401, detail="PIN incorrecto.")
    return {"success": True, "location_id": req.location_id}
