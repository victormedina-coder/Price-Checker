import os
from dotenv import load_dotenv

load_dotenv()

SHOPIFY_CLIENT_ID     = os.getenv("SHOPIFY_CLIENT_ID")
SHOPIFY_CLIENT_SECRET = os.getenv("SHOPIFY_CLIENT_SECRET")
SHOPIFY_STORE_DOMAIN  = os.getenv("SHOPIFY_STORE_DOMAIN")
SHOPIFY_API_VERSION   = os.getenv("SHOPIFY_API_VERSION", "2024-04")

GRAPHQL_URL = f"https://{SHOPIFY_STORE_DOMAIN}/admin/api/{SHOPIFY_API_VERSION}/graphql.json"


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
