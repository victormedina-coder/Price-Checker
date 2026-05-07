# Price Checker — Verificador de Precios

**Proyecto:** Price Checker (Piloto: Western Brothers)  
**Sponsor:** Miguel Nava  
**Dueño del Proyecto:** Gerardo Falcon (Gerente Regional Retail)  
**Desarrollador Responsable:** Víctor Medina (victor.medina@1522.mx)

Verificador de precios "Zero-Touch" para kioscos Android de 11 pulgadas con escáner de código de barras integrado (modo HID). Diseñado para piso de tienda: el cliente escanea — la app muestra precio, tallas e inventario multi-sucursal en tiempo real.

---

## Estructura del Repositorio

```
Price-Checker/
├── backend/                  # API FastAPI (Python) — compartida por todos los clientes
│   ├── providers/
│   │   ├── base.py           # Puerto (interfaz ProductProvider)
│   │   └── shopify.py        # Adaptador Shopify
│   ├── routers/
│   │   ├── products.py       # GET /products/{barcode} — con caché 15 min
│   │   └── locations.py      # GET /locations, POST /locations/auth
│   ├── shopify/
│   │   ├── client.py         # Cliente HTTP + token OAuth
│   │   └── querys.py         # Queries GraphQL
│   ├── config.py             # Variables de entorno
│   ├── main.py               # App FastAPI + middleware de logs
│   ├── pyrightconfig.json    # Configuración de analizador estático
│   └── .env                  # Credenciales (no commitear)
│
├── frontendWB/               # Cliente Western Brothers (Next.js)
├── frontendStetson/          # Cliente Stetson (Next.js)
└── frontend/                 # Cliente Ariat (Next.js)
```

---

## Stack Tecnológico

| Capa           | Tecnología                                       |
| -------------- | ------------------------------------------------ |
| Frontend       | Next.js 15, React, CSS Variables (Design Tokens) |
| Backend        | FastAPI (Python 3.11+), httpx                    |
| API de datos   | Shopify GraphQL Admin API `2024-04`              |
| Patrón         | Arquitectura Hexagonal (Puertos y Adaptadores)   |
| Caché          | In-memory dict con TTL de 15 minutos             |
| Hosting (prod) | Vercel Pro (frontend) + Railway Hobby (backend)  |

---

## Requisitos Previos

- **Node.js** v18 o superior
- **Python** 3.11 o superior
- **Escáner de código de barras** configurado en modo HID (emulación de teclado)

---

## Levantar el Proyecto en Local

### 1. Clonar el repositorio

```bash
git clone https://github.com/GQ22/price-checker.git
cd price-checker
```

### 2. Configurar y levantar el Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Si al ejecutar da error instalar manualmente fastAPI
pip install "fastapi[standard]"

# Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con las credenciales reales (ver sección Variables de Entorno)

# Levantar el servidor
fastapi dev main.py
```

El backend estará disponible en `http://localhost:8000`.  
Documentación interactiva: `http://localhost:8000/docs`.

### 3. Configurar y levantar un Frontend

Cada cliente (marca) es un proyecto Next.js independiente. Se pueden correr en paralelo en puertos distintos.

```bash
# Western Brothers
cd frontendWB
npm install
npm run dev          # Puerto 3000

# Stetson (en otra terminal)
cd frontendStetson
npm install
npm run dev -- -p 3001

# Ariat (en otra terminal)
cd frontend
npm install
npm run dev -- -p 3002
```

| Cliente          | URL local             |
| ---------------- | --------------------- |
| Western Brothers | http://localhost:3000 |
| Stetson          | http://localhost:3001 |
| Ariat            | http://localhost:3002 |

---

## Variables de Entorno

### Backend — `backend/.env`

```env
# Shopify OAuth
SHOPIFY_CLIENT_ID=tu_client_id
SHOPIFY_CLIENT_SECRET=tu_client_secret
SHOPIFY_STORE_DOMAIN=tu-tienda.myshopify.com
SHOPIFY_API_VERSION=2024-04

# Fuente de datos (shopify | odoo | netsuite)
DATA_SOURCE=shopify

# PINs de sucursales: "gid://shopify/Location/ID:pin,..."
LOCATION_PINS=gid://shopify/Location/XXXXX:1234,gid://shopify/Location/YYYYY:5678
```

### Frontend — `.env` por cliente

Cada carpeta de frontend tiene su propio `.env`:

```env
# URL del backend FastAPI
NEXT_PUBLIC_API_URL=http://192.168.x.x:8000

# Segundos de inactividad antes de reiniciar la pantalla de resultados
NEXT_PUBLIC_RESULT_TIMEOUT=15

# Milisegundos que dura el modal de "producto no encontrado" antes de cerrarse
NEXT_PUBLIC_ERROR_TIMEOUT=2000

# Modo mantenimiento — bloquea toda la app (true | false)
NEXT_PUBLIC_MAINTENANCE=false
```

> ⚠️ Los archivos `.env` **nunca** deben commitearse. Están incluidos en `.gitignore`.

---

## Arquitectura Hexagonal

El backend sigue el patrón Puertos y Adaptadores. El router nunca llama a Shopify directamente:

```
Frontend (Next.js)
    ↓  GET /products/{barcode}
Router products.py  [caché 15 min en memoria]
    ↓
get_provider()  ←  lee DATA_SOURCE del .env
    ↓
ProductProvider (interfaz abstracta — providers/base.py)
    ↓
ShopifyProductAdapter (providers/shopify.py)
    ↓
Shopify GraphQL API  (versión 2024-04)
```

**Para agregar una nueva fuente de datos (ej. Odoo):**

1. Crear `backend/providers/odoo.py` con clase `OdooProductAdapter(ProductProvider)`
2. Implementar el método `get_product(barcode: str) -> dict`
3. Registrar el adaptador en `get_provider()` dentro de `routers/products.py`
4. Cambiar en `.env`: `DATA_SOURCE=odoo`

El frontend y la lógica del router no requieren ningún cambio.

---

## Modo Mantenimiento (Rollback de Emergencia)

Para desactivar el kiosko ante un incidente crítico:

1. Cambiar en el `.env` del cliente afectado:
   ```env
   NEXT_PUBLIC_MAINTENANCE=true
   ```
2. Reiniciar el servidor de desarrollo, o en producción (Vercel): actualizar la variable en el dashboard y hacer redeploy (~1 min).
3. La pantalla "En Mantenimiento" bloqueará toda la app automáticamente.

Para reactivar, cambiar de vuelta a `NEXT_PUBLIC_MAINTENANCE=false` y reiniciar.

---

## Características Implementadas

| Característica            | Detalle                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| Zero-Touch UI             | El flujo completo se controla con el escáner (modo HID)                             |
| Multi-marca               | 3 clientes independientes: WB, Stetson, Ariat — misma lógica, distinto branding     |
| Timeout de privacidad     | Retorno automático a screensaver tras 15 s (configurable)                           |
| Caché de productos        | TTL de 15 min en memoria — respuesta < 50 ms para productos cacheados               |
| Inventario multi-sucursal | Stock por sucursal con la actual destacada                                          |
| Detección offline         | Banner automático al perder WiFi, recuperación automática                           |
| Timeout de servicio       | Si Shopify no responde en 5 s → "Servicio no disponible temporalmente"              |
| Validación de input       | Rechaza códigos < 3 o > 30 chars y caracteres no alfanuméricos                      |
| Pantalla de mantenimiento | Activable por env var para rollback de emergencia                                   |
| Logs operativos           | Latencia, cache hits, Not Founds y errores de Shopify                               |
| Arquitectura hexagonal    | `ProductProvider` abstrae la fuente de datos — intercambiable sin tocar el frontend |
| API Shopify anclada       | Versión `2024-04` configurable por env var                                          |

---

## Documentación

| Documento               | Ruta                       |
| ----------------------- | -------------------------- |
| API interactiva (local) | http://localhost:8000/docs |

---

## Despliegue en Producción

### Frontend → Vercel (Plan Pro)

```bash
# Instalar CLI de Vercel
npm i -g vercel

# Desplegar (desde la carpeta del cliente)
cd frontendWB
vercel --prod
```

Configurar las variables de entorno (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RESULT_TIMEOUT`, `NEXT_PUBLIC_MAINTENANCE`) en el dashboard de Vercel → Settings → Environment Variables.

### Backend → Railway (Plan Hobby)

1. Conectar el repositorio de GitHub en Railway.
2. Seleccionar la carpeta `backend/` como directorio raíz.
3. Configurar las variables de entorno en Railway → Variables.
4. Railway desplegará automáticamente en cada push a `main`.

**Costo mensual estimado:** $25 USD/mes (Vercel Pro $20 + Railway Hobby $5).
