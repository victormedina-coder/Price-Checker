LOCATIONS_QUERY = """
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

PRODUCT_BY_BARCODE_QUERY = """
query ProductByBarcode($barcode: String!) {
  productVariants(first: 1, query: $barcode) {
    edges {
      node {
        id
        sku
        barcode
        title
        price
        compareAtPrice
        availableForSale
        selectedOptions {
          name
          value
        }
        inventoryItem {
          inventoryLevels(first: 20) {
            edges {
              node {
                quantities(names: ["available"]) {
                  name
                  quantity
                }
                location {
                  id
                  name
                }
              }
            }
          }
        }
        product {
          title
          vendor
          productType
          variants(first: 50) {
            edges {
              node {
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
              }
            }
          }
          options {
            name
            values
          }
          metafields(first: 20) {
            edges {
              node {
                namespace
                key
                value
              }
            }
          }
        }
      }
    }
  }
}
"""
