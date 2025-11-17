from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from db import fetch_one, fetch_all
import queries as Q
from models import (
    CoinRankItem, TopUptrendItem, MarketGrowthItem, VolumeGrowthItem,
    SentimentItem, SparklineItem, CoinDetailMetrics, PriceCandle, NewsItem,
    MarketChange7DItem, MarketChange30DItem,
    MarketCapGrowthCalculatedItem
)
import uvicorn

app = FastAPI(title="Crypto Market Data API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# =========================================
# DASHBOARD ENDPOINTS
# =========================================
@app.get("/api/coins/top100", response_model=List[CoinRankItem], tags=["Dashboard"])
def get_top100_coins(): return fetch_all(Q.Q_TOP_100_COINS_BY_MARKETCAP)

@app.get("/api/coins/sparklines", response_model=List[SparklineItem], tags=["Dashboard"])
def get_all_sparklines(): return fetch_all(Q.Q_COIN_SPARKLINES_7D)

@app.get("/api/market/uptrend", response_model=List[TopUptrendItem], tags=["Dashboard"])
def get_top_uptrend(): return fetch_all(Q.Q_TOP_5_COINS_UP_TRENDING_1D)

@app.get("/api/market/cap_growth", response_model=MarketGrowthItem, tags=["Dashboard"])
def get_market_cap_growth():
    row = fetch_one(Q.Q_MARKET_CHANGE_1D); return row or {"change_pct_market_1d": None}

@app.get("/api/market/volume_growth", response_model=VolumeGrowthItem, tags=["Dashboard"])
def get_volume_growth():
    row = fetch_one(Q.Q_VOLUME_24H); return row or {"volume_growth_pct": None}

@app.get("/api/market/sentiment", response_model=SentimentItem, tags=["Dashboard"])
def get_market_sentiment():
    row = fetch_one(Q.Q_MARKET_SENTIMENT); return row or {"average_sentiment_score": 0, "market_sentiment_label": "Neutral"}

@app.get("/api/market/cap_growth_7d", response_model=MarketChange7DItem, tags=["Dashboard"])
def get_market_cap_growth_7d():
    row = fetch_one(Q.Q_MARKET_CHANGE_7D); return row or {"change_pct_market_7d": None}

@app.get("/api/market/cap_growth_30d", response_model=MarketChange30DItem, tags=["Dashboard"])
def get_market_cap_growth_30d():
    row = fetch_one(Q.Q_MARKET_CHANGE_30D); return row or {"change_pct_market_30d": None}

# --- ENDPOINT BỊ THIẾU LÀ ĐÂY ---
@app.get("/api/market/cap_growth_calc", response_model=MarketCapGrowthCalculatedItem, tags=["Dashboard"])
def get_market_cap_growth_calc():
    """Tính toán % tăng trưởng Vốn hóa thị trường 24h (từ fact_market_cap)"""
    row = fetch_one(Q.Q_MARKET_CAP_GROWTH_CALCULATED)
    return row or {"change_pct_market_cap_calc": None}

# =========================================
# COIN DETAIL ENDPOINTS
# =========================================
@app.get("/api/coins/{coin_id}/metrics", response_model=CoinDetailMetrics, tags=["Coin Detail"])
def get_coin_metrics(coin_id: str):
    row = fetch_one(Q.Q_COIN_DETAIL_ALL_METRICS, {"coin_id": coin_id})
    if not row: raise HTTPException(404, detail="Coin metrics not found")
    return row

@app.get("/api/coins/{coin_id}/history", response_model=List[PriceCandle], tags=["Coin Detail"])
def get_coin_history(
    coin_id: str,
    start_date: str = Query(..., description="Ngày bắt đầu (YYYY-MM-DD)"),
    time_range: str = Query("1Y", description="Khoảng thời gian (1D, 1W, 1M, 3M, 1Y, ALL)")
):
    params = {"coin_id": coin_id, "start_date": start_date}
    if time_range in ('1D', '1W', '1M'): query_to_run = Q.Q_COIN_HISTORY_DAILY
    elif time_range in ('3M', '1Y'): query_to_run = Q.Q_COIN_HISTORY_WEEKLY
    else: query_to_run = Q.Q_COIN_HISTORY_MONTHLY
    return fetch_all(query_to_run, params)

@app.get("/api/coins/{coin_id}/news", response_model=List[NewsItem], tags=["Coin Detail"])
def get_coin_news(coin_id: str):
    return fetch_all(Q.Q_COIN_DETAIL_NEWS, {"coin_id": coin_id})

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8888, reload=True)