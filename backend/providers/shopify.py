from fastapi import HTTPException
from shopify.client import shopify_query_with_vars
from shopify.querys import PRODUCT_BY_BARCODE_QUERY
from providers.base import ProductProvider


class ShopifyProductAdapter(ProductProvider):
    """
    Adaptador (Adapter) — implementa ProductProvider usando la API de Shopify.
    """

    async def get_product(self, barcode: str) -> dict:
        data = await shopify_query_with_vars(
            PRODUCT_BY_BARCODE_QUERY,
            {"barcode": f"barcode:{barcode}"},
        )
        return self._parse(data)

    # ── Parseo interno ────────────────────────────────────────────────────────

    def _parse(self, data: dict) -> dict:
        edges = data["data"]["productVariants"]["edges"]
        if not edges:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        node    = edges[0]["node"]
        product = node["product"]

        options_map      = {o["name"]: o["value"] for o in node["selectedOptions"]}
        color            = options_map.get("Color")
        size_option_name = next(
            (o["name"] for o in node["selectedOptions"] if o["name"] != "Color"), None
        )
        size = options_map.get(size_option_name) if size_option_name else None

        all_sizes = []
        if size_option_name:
            for opt in product["options"]:
                if opt["name"] == size_option_name:
                    all_sizes = opt["values"]
                    break

        available_sizes = []
        for v_edge in product["variants"]["edges"]:
            v      = v_edge["node"]
            v_opts = {o["name"]: o["value"] for o in v["selectedOptions"]}
            same_color = color is None or v_opts.get("Color") == color
            if same_color and v["availableForSale"] and size_option_name:
                v_size = v_opts.get(size_option_name)
                if v_size:
                    available_sizes.append(v_size)

        all_images = [e["node"]["url"] for e in product["images"]["edges"]]
        if color:
            color_images = [
                e["node"]["url"] for e in product["images"]["edges"]
                if color in (e["node"]["altText"] or "")
            ]
            images = color_images if color_images else all_images
        else:
            images = all_images

        stock = [
            {
                "location_id":   e["node"]["location"]["id"],
                "location_name": e["node"]["location"]["name"],
                "available":     next(
                    (q["quantity"] for q in e["node"]["quantities"] if q["name"] == "available"), 0
                ),
            }
            for e in node["inventoryItem"]["inventoryLevels"]["edges"]
        ]

        metafields = {
            e["node"]["key"]: e["node"]["value"]
            for e in product["metafields"]["edges"]
            if e["node"]["namespace"] == "custom"
        }

        return {
            "name":             product["title"],
            "sku":              node["sku"],
            "price":            float(node["price"]),
            "priceSale":        float(node["compareAtPrice"]) if node["compareAtPrice"] else None,
            "vendor":           product["vendor"],
            "category":         product["productType"],
            "subcategory":      metafields.get("categoria"),
            "color":            color,
            "size":             size,
            "size_option_name": size_option_name,
            "images":           images,
            "all_sizes":        all_sizes,
            "available_sizes":  available_sizes,
            "stock":            stock,
            "metafields":       metafields,
        }
