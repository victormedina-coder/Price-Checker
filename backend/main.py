import logging
import os
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from routers import locations, products

# ── Logging config ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("price_checker")
# ─────────────────────────────────────────────────────────────────────────────

# ── Rate Limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

_is_prod = os.getenv("ENV", "development") == "production"
app = FastAPI(
    title="Price Checker API",
    docs_url=None if _is_prod else "/docs",
    redoc_url=None if _is_prod else "/redoc",
    openapi_url=None if _is_prod else "/openapi.json",
)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=429,
        content={"detail": "Demasiados intentos. Intente de nuevo en unos minutos."},
    )

# ── CORS (orígenes desde variable de entorno) ────────────────────────────────
_raw_origins = os.getenv("CORS_ORIGINS", "")
if not _raw_origins:
    logger.warning("CORS_ORIGINS no configurado — ningún origen permitido por defecto.")
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()] if _raw_origins else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_and_security_headers(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    ms = round((time.time() - start) * 1000)
    level = logging.WARNING if response.status_code >= 400 else logging.INFO
    logger.log(level, "%s %s → %s (%dms)", request.method, request.url.path, response.status_code, ms)
    # ── Security headers ──
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response

app.include_router(locations.router)
app.include_router(products.router)


@app.get("/")
def health_check():
    return {"status": "ok"}
