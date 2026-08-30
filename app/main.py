from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.bulk_deals import (
    router as bulk_deals_router,
)

from app.routes.weekly_deals import (
    router as weekly_deals_router,
)


app = FastAPI(
    title="BulkExpress",
    description="Indian Stock Market Bulk Deals API",
    version="1.0.0",
)


# --------------------------------
# CORS
# --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# Routes
# --------------------------------

app.include_router(
    bulk_deals_router
)

app.include_router(
    weekly_deals_router
)


@app.get("/")
async def root():

    return {
        "application": "BulkExpress",
        "status": "running",
    }


@app.get("/health")
async def health():

    return {
        "status": "healthy"
    }