import time
from dotenv import load_dotenv
import os
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Price Checker API")

SHOPIFY_CLIENT_ID = os.getenv("SHOPIFY_CLIENT_ID")
SHOPIFY_CLIENT_SECRET = os.getenv("SHOPIFY_CLIENT_SECRET")
SHOPIFY_STORE_DOMAIN = os.getenv("SHOPIFY_STORE_DOMAIN")
SHOPIFY_API_VERSION = os.getenv("SHOPIFY_API_VERSION")

GRAPHQL_URL = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{SHOPIFY_API_VERSION}/graphql.json"

# PINs en memoria: { "gid://shopify/Location/xxx": "1234" }
def _load_pins() -> dict:
    raw = os.getenv("LOCATION_PINS", "")
    pins = {}
    for entry in raw.split(","):
        entry = entry.strip()
        if ":" in entry:
            location_id, pin = entry.rsplit(":", 1)
            pins[location_id.strip()] = pin.strip()
    return pins

LOCATION_PINS: dict = _load_pins()

# ── Helpers ──────────────────────────────────────────────────────────────────

async def shopify_query(query: str) -> dict:
    token = await get_shopify_token()
    headers = {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GRAPHQL_URL,
            json={"query": query},
            headers=headers,
            timeout=10,
        )
    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail="Error al consultar shopify."
        )
    return response.json()

# Token cache en memoria: evita pedir uno nuevo en cada request
_token_cache: dict = {"access_token": None, "expires_at": 0}


async def get_shopify_token() -> str:
    now = time.time()
    # Renueva el token 60 segundos antes de que expire
    if _token_cache["access_token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["access_token"]

    if not SHOPIFY_CLIENT_ID or not SHOPIFY_CLIENT_SECRET or not SHOPIFY_STORE_DOMAIN:
        raise HTTPException(
            status_code=500,
            detail="Error de configuracion. Verifique las variables de entorno.",
        )

    url = f"https://{SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": SHOPIFY_CLIENT_ID,
        "client_secret": SHOPIFY_CLIENT_SECRET,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Shopify rechazó la solicitud de token: {response.text}",
        )

    data = response.json()
    _token_cache["access_token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 86400)

    return _token_cache["access_token"]

# ── Endpoints ─────────────────────────────────────────────────────────────────


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.get("/auth/shopify/token")
async def shopify_token():
    """Obtiene un access token de Shopify. Solo para pruebas internas."""
    token = await get_shopify_token()
    return {"access_token": token}

@app.get("/locations")
async def get_locations():
    query = """
    {
      locations(first: 20) {
        edges {
          node {
            id
            name
            isActive
            address {
              city
              province
            }
          }
        }
      }
    }
    """
    data = await shopify_query(query)
    locations = [
        {
            "id": edge["node"]["id"],
            "name": edge["node"]["name"],
            "city": edge["node"]["address"]["city"],
            "isActive": edge["node"]["isActive"],
        }
        for edge in data["data"]["locations"]["edges"]
        if edge["node"]["isActive"]
    ]
    return locations

class AuthRequest(BaseModel):
    location_id: str
    pin: str

@app.post("/locations/auth")
def auth_location(req: AuthRequest):
    expected_pin = LOCATION_PINS.get(req.location_id)
    if expected_pin is None:
        raise HTTPException(status_code= 404, detail = "Sucursal no encontrada.")
    if req.pin != expected_pin:
        raise HTTPException(status_code= 401, detail = "PIN incorrecto.")
    return {"success": True, "location id": req.location_id}