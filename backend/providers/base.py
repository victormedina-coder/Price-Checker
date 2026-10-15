from abc import ABC, abstractmethod
from math import isfinite


class ProductProvider(ABC):
    """
    Puerto (Port) — interfaz que define el contrato de consulta de productos.
    Cualquier fuente de datos (Shopify, Odoo, NetSuite, mock) debe implementarla.
    """

    @abstractmethod
    async def get_product(self, barcode: str) -> dict:
        """
        Busca un producto por código de barras o SKU.
        Retorna un dict con el producto parseado.
        Lanza HTTPException 404 si no se encuentra.
        """
        ...


def resolve_prices(price: float, compare_at: str | float | None) -> tuple[float, float | None]:
    """compare_at es el precio original en Shopify: solo hay oferta si es mayor al precio que se cobra."""
    try:
        original = float(compare_at)
    except (TypeError, ValueError):
        return price, None
    if price > 0 and isfinite(original) and original > price:
        return original, price
    return price, None
