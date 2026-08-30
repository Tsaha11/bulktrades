import httpx
from datetime import date, timedelta


def get_date_range(
    timeframe: int,
) -> tuple[date, date]:

    today = date.today()

    from_date = (
        today - timedelta(days=timeframe)
    )

    return from_date, today


class StockService:

    BASE_URL = "https://www.nseindia.com"

    HEADERS = {
        "User-Agent": "Mozilla/5.0",
        "Accept": (
            "application/json, text/plain, */*"
        ),
        "Referer": (
            "https://www.nseindia.com/"
            "report-detail/display-bulk-and-block-deals"
        ),
    }

    async def get_bulk_deal_symbols(
        self,
    ) -> list[dict]:

        url = (
            f"{self.BASE_URL}"
            "/api/historicalOR/"
            "bulk-block-short-symbols"
        )

        params = {
            "optionType": "bulk_deals"
        }

        async with httpx.AsyncClient(
            http2=False,
            timeout=30,
        ) as client:

            await client.get(
                self.BASE_URL,
                headers=self.HEADERS,
            )

            response = await client.get(
                url,
                params=params,
                headers=self.HEADERS,
            )

            response.raise_for_status()

            return response.json().get(
                "data",
                [],
            )