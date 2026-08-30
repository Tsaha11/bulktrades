from pydantic import BaseModel


class WeeklyDeal(BaseModel):

    deal_type: str

    date: str

    symbol: str

    company: str

    client: str

    side: str

    quantity: int

    price: float

    value_crores: float

    remarks: str = ""


class WeeklyDealsResponse(BaseModel):

    success: bool

    from_date: str

    to_date: str

    total_count: int

    bulk_deals_count: int

    block_deals_count: int

    short_selling_count: int

    data: list[WeeklyDeal]