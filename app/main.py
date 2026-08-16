from fastapi import FastAPI

from app.routes.bulk_deals import router as bulk_deals_router


app = FastAPI(
    title="BulkExpress",
    description="Indian Stock Market Bulk Deals API",
    version="1.0.0",
)


app.include_router(
    bulk_deals_router
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