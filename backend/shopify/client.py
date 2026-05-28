import logging
import time
import httpx
from fastapi import HTTPException
from config import BrandConfig

logger = logging.getLogger("price_checker.shopify")

# Cache de tokens por marca: brand → {access_token, expires_at}
_token_cache: dict[str, dict] = {}


async def get_shopify_token(cfg: BrandConfig) -> str:
    # ── TEMPORAL: si la marca tiene token estático (shpat_), usarlo directo ──
    # Eliminar este bloque cuando todas las marcas tengan client_id/client_secret
    if cfg.static_token:
        logger.debug("Shopify [%s] usando token estático (shpat_)", cfg.brand)
        return cfg.static_token
    # ── FIN TEMPORAL ──

    now = time.time()
    cached = _token_cache.get(cfg.brand)
    if cached and cached["access_token"] and now < cached["expires_at"] - 60:
        return cached["access_token"]

    url = f"https://{cfg.domain}/admin/oauth/access_token"
    payload = {
        "grant_type":    "client_credentials",
        "client_id":     cfg.client_id,
        "client_secret": cfg.client_secret,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            url,
            data=payload,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )

    if response.status_code != 200:
        logger.error("Shopify [%s] rechazó token: status=%s body=%s", cfg.brand, response.status_code, response.text[:200])
        raise HTTPException(status_code=502, detail=f"Shopify rechazó la solicitud de token para '{cfg.brand}'.")

    data = response.json()
    _token_cache[cfg.brand] = {
        "access_token": data["access_token"],
        "expires_at":   now + data.get("expires_in", 86400),
    }
    logger.info("Shopify [%s] token renovado (expira en %ds)", cfg.brand, data.get("expires_in", 86400))
    return data["access_token"]


def _graphql_url(cfg: BrandConfig) -> str:
    return f"https://{cfg.domain}/admin/api/{cfg.api_version}/graphql.json"


def _check_graphql_errors(data: dict, cfg: BrandConfig, context: str = "") -> None:
    """Lanza HTTPException si la respuesta GraphQL contiene errores o data es None."""
    if data.get("data") is None:
        errors = data.get("errors", [])
        messages = [e.get("message", "") for e in errors]
        logger.error("Shopify [%s] GraphQL%s data=null errors=%s", cfg.brand, f" ({context})" if context else "", messages)
        raise HTTPException(
            status_code=502,
            detail="Error al consultar el catálogo. Intente de nuevo más tarde.",
        )


async def shopify_query(query: str, cfg: BrandConfig) -> dict:
    token = await get_shopify_token(cfg)
    headers = {"X-Shopify-Access-Token": token, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        response = await client.post(_graphql_url(cfg), json={"query": query}, headers=headers, timeout=10)
    if response.status_code != 200:
        logger.error("Shopify [%s] GraphQL error: status=%s", cfg.brand, response.status_code)
        raise HTTPException(status_code=502, detail="Error al consultar Shopify.")
    data = response.json()
    _check_graphql_errors(data, cfg)
    return data


async def shopify_query_with_vars(query: str, variables: dict, cfg: BrandConfig) -> dict:
    token = await get_shopify_token(cfg)
    headers = {"X-Shopify-Access-Token": token, "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        response = await client.post(
            _graphql_url(cfg),
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=10,
        )
    if response.status_code != 200:
        logger.error("Shopify [%s] GraphQL (vars) error: status=%s vars=%s", cfg.brand, response.status_code, variables)
        raise HTTPException(status_code=502, detail="Error al consultar Shopify.")
    data = response.json()
    _check_graphql_errors(data, cfg, context=str(variables))
    return data
