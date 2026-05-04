from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import locations, products

app = FastAPI(title="Price Checker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(locations.router)
app.include_router(products.router)


@app.get("/")
def health_check():
    return {"status": "ok"}
