from datetime import date, timedelta

from fastapi import APIRouter, HTTPException

from app.schemas.weekly_deals import (
    WeeklyDeal,
    WeeklyDealsResponse,
)

from app.services.nse import NSEClient


router = APIRouter(
    prefix="/api/v1",
    tags=["Weekly Deals"],
)


@router.get(
    "/weekly-deals",
    response_model=WeeklyDealsResponse,
)
async def get_weekly_deals():

    # --------------------------------
    # Last 7 calendar days
    # --------------------------------

    to_date = date.today()

    from_date = (
        to_date - timedelta(days=6)
    )

    # --------------------------------
    # NSE Client
    # --------------------------------

    client = NSEClient()

    try:

        raw_data = (
            await client.get_all_weekly_deals(
                from_date=from_date,
                to_date=to_date,
            )
        )

    except Exception as exc:

        raise HTTPException(
            status_code=502,
            detail=f"NSE request failed: {exc}",
        )

    # --------------------------------
    # Transform all deal types
    # --------------------------------

    data = []

    for deal_type, deals in raw_data.items():

        for item in deals:

            try:

                quantity = int(
                    item.get(
                        "BD_QTY_TRD",
                        0,
                    )
                )

                price = float(
                    item.get(
                        "BD_TP_WATP",
                        0,
                    )
                )

            except (
                ValueError,
                TypeError,
            ):

                # Skip invalid NSE records
                continue

            value_crores = (
                quantity * price
            ) / 10_000_000

            # --------------------------------
            # Deal type
            # --------------------------------

            if deal_type == "bulk_deals":

                display_deal_type = "BULK"

            elif deal_type == "block_deals":

                display_deal_type = "BLOCK"

            elif deal_type == "short_selling":

                display_deal_type = "SHORT_SELLING"

            else:

                display_deal_type = deal_type

            # --------------------------------
            # Create normalized record
            # --------------------------------

            data.append(
                WeeklyDeal(

                    deal_type=display_deal_type,

                    date=item.get(
                        "BD_DT_DATE"
                    ) or "",

                    symbol=item.get(
                        "BD_SYMBOL"
                    ) or "",

                    company=item.get(
                        "BD_SCRIP_NAME"
                    ) or "",

                    client=item.get(
                        "BD_CLIENT_NAME"
                    ) or "",

                    side=item.get(
                        "BD_BUY_SELL"
                    ) or "",

                    quantity=quantity,

                    price=price,

                    value_crores=round(
                        value_crores,
                        2,
                    ),

                    remarks=item.get(
                        "BD_REMARKS"
                    ) or "",
                )
            )

    # --------------------------------
    # Counts
    # --------------------------------

    bulk_count = len(
        raw_data.get(
            "bulk_deals",
            [],
        )
    )

    block_count = len(
        raw_data.get(
            "block_deals",
            [],
        )
    )

    short_selling_count = len(
        raw_data.get(
            "short_selling",
            [],
        )
    )

    # --------------------------------
    # Response
    # --------------------------------

    return WeeklyDealsResponse(

        success=True,

        from_date=from_date.strftime(
            "%Y-%m-%d"
        ),

        to_date=to_date.strftime(
            "%Y-%m-%d"
        ),

        total_count=len(data),

        bulk_deals_count=bulk_count,

        block_deals_count=block_count,

        short_selling_count=(
            short_selling_count
        ),

        data=data,
    )