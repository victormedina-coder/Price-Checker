# Price Checker

**Proyecto:** Price Checker (Piloto: Western Brothers)
**Dueño del Proyecto:** Gerardo Falcon (Gerente Regional Retail)
**Desarrollador Responsable:** Víctor Medina

Este repositorio contiene el código fuente para el verificador de precios "Zero-Touch", optimizado para ejecutarse en una tablet Android (formato Landscape) con escáner de código de barras físico.

## Arquitectura

El sistema está dividido en dos partes principales usando una Arquitectura Hexagonal:

- **Frontend**: Construido con [Next.js](https://nextjs.org/) y React. Interfaz de usuario responsiva, controlada exclusivamente con CSS Vanilla (Design Tokens) y optimizada para no requerir toques en pantalla.
- **Backend** _(En desarrollo)_: Construido con **FastAPI** (Python). Actúa como un middleware abstraído para conectarse a Shopify (o futuros ERPs) usando inyección de dependencias (`ProductProvider`).

## Requisitos Previos

- Node.js (v18 o superior)
- Python (3.10 o superior) - _Para el backend_
- Escáner de código de barras configurado en modo HID (emulación de teclado).

## Instrucciones para Levantar el Proyecto Localmente

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-organizacion-gq22/price-checker.git
cd price-checker
```

### 2. Configuración del Frontend (Next.js)

El frontend contiene los componentes interactivos, el protector de pantalla animado y la lógica de inactividad (15 segundos).

```bash
cd Frontend
npm install
npm run dev
```

La interfaz estará disponible en [http://localhost:3000].

### 3. Configuración del Backend (FastAPI)

_(El backend está en la carpeta `Backend`. Asegúrate de tener Python instalado)._

```bash
cd Backend
python -m venv venv
# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
fastapi dev main.py
```

El backend estará disponible en [http://localhost:8000].

### 4. Variables de Entorno (.env)

Deberás crear un archivo `.env` en la carpeta `Backend` con las siguientes credenciales:

```env
# Variables de Entorno del Backend
SHOPIFY_ACCESS_TOKEN=tu_token_de_acceso_corporativo
SHOPIFY_STORE_DOMAIN=western-brothers.myshopify.com
SHOPIFY_API_VERSION=2024-04
DATA_SOURCE=shopify
```

## Características Principales Implementadas

- **Zero-Touch UI**: El flujo entero se controla mediante el escáner.
- **Timeout de Privacidad**: Retorno a la pantalla inicial en 15 segundos exactos para ocultar consultas previas.
- **Gestión de Stock por Tallas**: Indicadores visuales de tallas disponibles, talla actual (escaneada) y tallas agotadas (tachadas).
- **Resiliencia**: Detector Offline integrado que bloquea la interfaz mostrando un mensaje amigable si se pierde la conexión Wi-Fi.
