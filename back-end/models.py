# models.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date

# --- DASHBOARD MODELS ---
class CoinRankItem(BaseModel):
    rank: int
    coin_id: str
    name: str
    symbol: str  # <- Đã thêm
    price: float
    change_24h: Optional[float]
    market_cap: Optional[float]
    volume: Optional[float]

class TopUptrendItem(BaseModel):
    coin_id: str
    name: str
    symbol: str
    price: float
    percent_change: float

class MarketGrowthItem(BaseModel):
    change_pct_market_1d: Optional[float]

class VolumeGrowthItem(BaseModel):
    volume_growth_pct: Optional[float]

class SentimentItem(BaseModel):
    average_sentiment_score: Optional[float]
    market_sentiment_label: Optional[str]

class SparklineItem(BaseModel):
    coin_id: str
    sparkline_prices: List[float]

class MarketChange7DItem(BaseModel):
    change_pct_market_7d: Optional[float]

class MarketChange30DItem(BaseModel):
    change_pct_market_30d: Optional[float]

class MarketCapGrowthCalculatedItem(BaseModel):
    change_pct_market_cap_calc: Optional[float]

# --- COIN DETAIL MODELS ---
class CoinDetailMetrics(BaseModel):
    market_cap_usd: Optional[float]
    market_cap_change_pct_24h: Optional[float]
    volume24: Optional[float]
    volume_change_pct_24h: Optional[float]
    fdv: Optional[float]
    vol_per_mkt_cap_24h: Optional[float]
    total_supply: Optional[float]
    max_supply: Optional[float]
    circulating_supply: Optional[float]
    price_usd: Optional[float] # <- Thêm giá

class PriceCandle(BaseModel):
    date: datetime 
    open: Optional[float] = 0
    high: Optional[float] = 0
    low: Optional[float] = 0
    close: Optional[float] = 0
    volume: Optional[float] = 0

class NewsItem(BaseModel):
    title: str
    published_on: datetime
    url: str
    source_id: Optional[str]
    sentiment: Optional[str]
    score: Optional[float] = 0.0
    keywords: Optional[str] = None