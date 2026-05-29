const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured.");

// ── Error types ──────────────────────────────────────────────────────────────
export class ProductNotFoundError extends Error {}
export class ServiceUnavailableError extends Error {}
// ─────────────────────────────────────────────────────────────────────────────

export async function getLocations(){
    const res = await fetch(`${API_URL}/locations`, {
        headers: { "X-Brand": process.env.NEXT_PUBLIC_BRAND! },
    });
    if (!res.ok) throw new Error("No se pudieron cargar las sucursales.");
    return res.json();
}

export async function authLocation(location_id: string, pin: string){
    const res = await fetch(`${API_URL}/locations/auth`, {
        method: "POST",
        headers: {"content-type": "application/json",
            "X-Brand": process.env.NEXT_PUBLIC_BRAND!,
        },
        body: JSON.stringify({location_id, pin})
    });

    if (res.status === 401) throw new Error("PIN incorrecto.")
    if (res.status === 404) throw new Error("Sucursal no encontrada.")
    if (!res.ok) throw new Error("Error al autenticar.")
    return res.json();
}

export async function getProduct(barcode: string) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // 5 s timeout

    try {
        const res = await fetch(`${API_URL}/products/${barcode}`, {
            signal: controller.signal,
            headers: { "X-Brand": process.env.NEXT_PUBLIC_BRAND! },
        });
        if (res.status === 404) throw new ProductNotFoundError("Producto no encontrado.");
        if (!res.ok)            throw new ServiceUnavailableError("Servicio no disponible.");
        return res.json();
    } catch (e) {
        if (e instanceof ProductNotFoundError || e instanceof ServiceUnavailableError) throw e;
        // AbortError (timeout) o TypeError (sin red)
        throw new ServiceUnavailableError("Servicio no disponible.");
    } finally {
        clearTimeout(timer);
    }
}
