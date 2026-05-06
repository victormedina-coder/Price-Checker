const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function getLocations(){
    const res = await fetch(`${API_URL}/locations`)
    if (!res.ok) throw new Error("No se pudieron cargar las sucursales.");
    return res.json();
}

export async function authLocation(location_id: string, pin: string){
    const res = await fetch(`${API_URL}/locations/auth`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({location_id, pin})
    });

    if (res.status === 401) throw new Error("PIN incorrecto.")
    if (res.status === 404) throw new Error("Sucursal no encontrada.")
    if (!res.ok) throw new Error("Error al autenticar.")
    return res.json();
}

export async function getProduct(barcode: string) {
    const res = await fetch(`${API_URL}/products/${barcode}`);
    if (res.status === 404) throw new Error("Producto no encontrado.")
    if (!res.ok) throw new Error("Error al obtener el producto.")
    return res.json();
}
