from abc import ABC, abstractmethod


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
