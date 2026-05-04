from pydantic.deprecated import json
import time
import httpx
from fastapi import HTTPException
from config import SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET, SHOPIFY_STORE_DOMAIN, GRAPHQL_URL

_token_cache: dict = {"access_token": None, "expires_at": 0}


async def get_shopify_token() -> str:
    now = time.time()
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
        raise HTTPException(status_code=502, detail="Error al consultar Shopify.")
    return response.json()

async def shopify_query_with_vars(query: str, variables: dict) -> dict:
    token = await get_shopify_token()
    headers = {
        "X-Shopify-Access-Token": token,
        "Content-Type": "application/json"
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=10,
        )
    if response.status_code != 200:
        raise HTTPException(status_code = 502, detail = "Error al consultar Shopify")
    return response.json()