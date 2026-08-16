from pydantic import BaseModel


class BulkDeal(BaseModel):
    date: str
    symbol: str
    company: str
    client: str
    side: str
    quantity: int
    price: float
    value_crores: float
    remarks: str


class BulkDealResponse(BaseModel):
    success: bool
    stock: str
    symbol: str
    timeframe: int
    from_date: str
    to_date: str
    count: int
    data: list[BulkDeal]