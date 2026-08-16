from fastapi import APIRouter, HTTPException, Query

from app.schemas.bulk_deal import (
    BulkDeal,
    BulkDealResponse,
)

from app.services.nse import NSEClient
from app.services.stock import get_date_range


router = APIRouter(
    prefix="/api/v1",
    tags=["Bulk Deals"],
)


@router.get(
    "/bulk-deals",
    response_model=BulkDealResponse,
)
async def get_bulk_deals(

    stock: str = Query(
        ...,
        description="Stock name or NSE symbol",
        min_length=1,
    ),

    timeframe: int = Query(
        ...,
        ge=0,
        le=3,
        description=(
            "0=today, 1=last 1 day, "
            "2=last 2 days, 3=last 3 days"
        ),
    ),
):

    # --------------------------------
    # Date range
    # --------------------------------

    from_date, to_date = get_date_range(
        timeframe
    )

    # --------------------------------
    # Resolve stock
    # --------------------------------

    symbol = stock.upper()

    # --------------------------------
    # Fetch NSE data
    # --------------------------------

    client = NSEClient()

    try:

        raw_data = await client.get_bulk_deals(
            symbol=symbol,
            from_date=from_date,
            to_date=to_date,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"NSE request failed: {exc}",
        )

    # --------------------------------
    # Transform
    # --------------------------------

    data = []

    for item in raw_data:

        quantity = int(
            item["BD_QTY_TRD"]
        )

        price = float(
            item["BD_TP_WATP"]
        )

        quantity = int(item["BD_QTY_TRD"])
        price = float(item["BD_TP_WATP"])

        value_crores = (quantity * price) / 10_000_000

        data.append(
            BulkDeal(
                date=item["BD_DT_DATE"],
                symbol=item["BD_SYMBOL"],
                company=item["BD_SCRIP_NAME"],
                client=item["BD_CLIENT_NAME"],
                side=item["BD_BUY_SELL"],
                quantity=quantity,
                price=price,
                value_crores=round(value_crores, 2),
                remarks=item["BD_REMARKS"],
            )
        )

    return BulkDealResponse(
        success=True,
        stock=stock,
        symbol=symbol,
        timeframe=timeframe,
        from_date=from_date.strftime("%Y-%m-%d"),
        to_date=to_date.strftime("%Y-%m-%d"),
        count=len(data),
        data=data,
    )