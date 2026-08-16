from datetime import date

import httpx


class NSEClient:

    BASE_URL = "https://www.nseindia.com"

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 "
            "(KHTML, like Gecko) "
            "Chrome/151.0.0.0 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": (
            "https://www.nseindia.com/"
            "report-detail/display-bulk-and-block-deals"
        ),
    }

    async def get_bulk_deals(
        self,
        symbol: str,
        from_date: date,
        to_date: date,
    ) -> list[dict]:

        url = (
            f"{self.BASE_URL}"
            "/api/historicalOR/"
            "bulk-block-short-deals"
        )

        params = {
            "optionType": "bulk_deals",
            "symbol": symbol,
            "from": from_date.strftime("%d-%m-%Y"),
            "to": to_date.strftime("%d-%m-%Y"),
        }

        async with httpx.AsyncClient(
            http2=False,
            timeout=30,
            follow_redirects=True,
        ) as client:

            # Establish NSE session
            await client.get(
                self.BASE_URL,
                headers=self.HEADERS,
            )

            response = await client.get(
                url,
                params=params,
                headers={
                    **self.HEADERS,
                    "Accept": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            )

            response.raise_for_status()

            result = response.json()

            return result.get("data", [])