# queries.py

# =============================================
# NHÓM 1: DASHBOARD & TỔNG QUAN THỊ TRƯỜNG
# =============================================

Q_TOP_100_COINS_BY_MARKETCAP = """
WITH latest_date AS (
    SELECT MAX(date_id) AS max_date_id FROM fact_coin_metrics
),
latest_metrics AS (
    SELECT m.coin_id, m.price_usd, m.percent_change_24h, m.market_cap_usd, m.volume24
    FROM fact_coin_metrics m
    JOIN latest_date ld ON m.date_id = ld.max_date_id
    WHERE m.market_cap_usd IS NOT NULL AND m.market_cap_usd > 0
),
deduped_metrics AS (
    SELECT
        ROW_NUMBER() OVER(PARTITION BY m.coin_id ORDER BY m.market_cap_usd DESC) as rn_per_coin,
        m.coin_id, 
        
        -- SỬA LỖI: Lấy tên chuẩn từ dim_currencies (e.g., "Bitcoin")
        COALESCE(dc.description, m.coin_id) AS coin_name, 
        
        -- SỬA LỖI: Lấy symbol (code) chuẩn từ dim_currencies (e.g., "BTC")
        COALESCE(dc.currency_code, UPPER(SUBSTRING(m.coin_id FROM 1 FOR 3))) AS coin_symbol,
        
        m.price_usd, m.percent_change_24h, m.market_cap_usd, m.volume24
    FROM latest_metrics m
    
    -- SỬA LỖI: Thêm 2 JOIN để mapping
    -- 1. Map 'bitcoin' (fact) sang 'btc' (mapping)
    LEFT JOIN dim_coin_mapping map ON m.coin_id = map.coin_id
    -- 2. Map 'btc' (mapping) sang 'BTC' và 'Bitcoin' (currencies)
    LEFT JOIN dim_currencies dc ON map.currency_id = dc.currency_id
),
ranked_coins AS (
    SELECT
        ROW_NUMBER() OVER(ORDER BY market_cap_usd DESC) AS rank,
        coin_id, 
        coin_name,
        coin_symbol,
        price_usd, percent_change_24h, market_cap_usd, volume24
    FROM deduped_metrics
    WHERE rn_per_coin = 1 
)
SELECT 
    rank, 
    coin_id, 
    coin_name AS name,
    coin_symbol AS symbol, -- Trả về symbol đã xử lý
    price_usd AS price, 
    percent_change_24h AS change_24h,
    market_cap_usd AS market_cap, 
    volume24 AS volume
FROM ranked_coins
WHERE rank <= 100
ORDER BY rank ASC;
"""

# queries.py

# ... (giữ nguyên các query khác ở trên) ...

# ====================================================
# FIX LỖI TRÙNG LẶP CHO TOP UPTREND
# ====================================================

# 1. Top 5 Uptrend 1 Ngày (Đã fix duplicate)
Q_TOP_5_UPTREND_1D = """
WITH latest_date AS (
    SELECT MAX(date_id) AS max_date_id FROM fact_coin_metrics
),
unique_daily_metrics AS (
    SELECT 
        m.coin_id,
        m.price_usd,
        m.percent_change_24h,
        -- Xếp hạng các dòng của cùng 1 coin theo thời gian cập nhật mới nhất (api_timestamp)
        ROW_NUMBER() OVER(PARTITION BY m.coin_id ORDER BY m.api_timestamp DESC) as rn
    FROM fact_coin_metrics m 
    JOIN latest_date ld ON m.date_id = ld.max_date_id
    WHERE m.percent_change_24h IS NOT NULL
)
SELECT 
    u.coin_id,
    COALESCE(dc.description, u.coin_id) AS name,
    COALESCE(dc.currency_code, UPPER(SUBSTRING(u.coin_id FROM 1 FOR 3))) AS symbol,
    u.price_usd AS price,
    u.percent_change_24h AS percent_change
FROM unique_daily_metrics u
LEFT JOIN dim_coin_mapping map ON u.coin_id = map.coin_id
LEFT JOIN dim_currencies dc ON map.currency_id = dc.currency_id
WHERE u.rn = 1 -- Chỉ lấy dòng mới nhất của mỗi coin
ORDER BY u.percent_change_24h DESC 
LIMIT 5;
"""

# 2. Top 5 Uptrend 1 Tuần (Đã fix duplicate)
Q_TOP_5_UPTREND_7D = """
WITH latest_date AS (
    SELECT MAX(date_id) AS max_date_id FROM fact_coin_metrics
),
unique_weekly_metrics AS (
    SELECT 
        m.coin_id,
        m.price_usd,
        m.percent_change_7d,
        ROW_NUMBER() OVER(PARTITION BY m.coin_id ORDER BY m.api_timestamp DESC) as rn
    FROM fact_coin_metrics m 
    JOIN latest_date ld ON m.date_id = ld.max_date_id
    WHERE m.percent_change_7d IS NOT NULL
)
SELECT 
    u.coin_id,
    COALESCE(dc.description, u.coin_id) AS name,
    COALESCE(dc.currency_code, UPPER(SUBSTRING(u.coin_id FROM 1 FOR 3))) AS symbol,
    u.price_usd AS price,
    u.percent_change_7d AS percent_change
FROM unique_weekly_metrics u
LEFT JOIN dim_coin_mapping map ON u.coin_id = map.coin_id
LEFT JOIN dim_currencies dc ON map.currency_id = dc.currency_id
WHERE u.rn = 1
ORDER BY u.percent_change_7d DESC 
LIMIT 5;
"""

# 3. Top 5 Uptrend 30 Ngày (Đã fix duplicate & Logic tính toán)
Q_TOP_5_UPTREND_30D = """
WITH latest_date AS (
    SELECT MAX(date_id) AS max_date_id FROM fact_coin_metrics
),
-- Lấy giá hiện tại duy nhất cho mỗi coin
price_current AS (
    SELECT 
        m.coin_id, m.price_usd,
        ROW_NUMBER() OVER(PARTITION BY m.coin_id ORDER BY m.api_timestamp DESC) as rn
    FROM fact_coin_metrics m
    JOIN latest_date ld ON m.date_id = ld.max_date_id
),
-- Lấy giá 30 ngày trước duy nhất cho mỗi coin
price_30d_ago AS (
    SELECT 
        m.coin_id, m.price_usd,
        ROW_NUMBER() OVER(PARTITION BY m.coin_id ORDER BY m.api_timestamp DESC) as rn
    FROM fact_coin_metrics m 
    JOIN latest_date ld ON m.date_id = (ld.max_date_id - 30) -- Giả định date_id là liên tục
)
SELECT 
    curr.coin_id,
    COALESCE(dc.description, curr.coin_id) AS name,
    COALESCE(dc.currency_code, UPPER(SUBSTRING(curr.coin_id FROM 1 FOR 3))) AS symbol,
    curr.price_usd AS price,
    CAST(ROUND(CAST(((curr.price_usd - prev.price_usd) / NULLIF(prev.price_usd, 0)) * 100.0 AS numeric), 2) AS double precision) AS percent_change
FROM price_current curr
JOIN price_30d_ago prev ON curr.coin_id = prev.coin_id
LEFT JOIN dim_coin_mapping map ON curr.coin_id = map.coin_id
LEFT JOIN dim_currencies dc ON map.currency_id = dc.currency_id
WHERE curr.rn = 1 AND prev.rn = 1 -- Chỉ lấy bản ghi đại diện duy nhất
  AND prev.price_usd > 0
ORDER BY percent_change DESC
LIMIT 5;
"""

Q_MARKET_CHANGE_1D = """
SELECT CAST(ROUND((g.market_cap_change_percentage_24h_usd * 100.0)::numeric, 2) AS double precision) AS change_pct_market_1d
FROM fact_market_global g JOIN dim_dates d ON g.date_id = d.date_id
ORDER BY d.full_date DESC LIMIT 1;
"""

Q_VOLUME_24H = """
WITH volume_by_day AS (
    SELECT d.full_date, 
           -- SỬA LỖI: Đổi mv.value thành mv.volume
           SUM(mv.volume) FILTER (WHERE LOWER(mv.currency_id) = 'usd') AS total_volume_usd,
           ROW_NUMBER() OVER (ORDER BY d.full_date DESC) AS rn
    FROM fact_market_volume mv
    JOIN fact_market_global g ON g.market_id = mv.market_id
    JOIN dim_dates d ON d.date_id = g.date_id
    GROUP BY d.full_date
)
SELECT CAST(ROUND(CAST(((cur.total_volume_usd - prev.total_volume_usd) / NULLIF(prev.total_volume_usd, 0)) * 100.0 AS numeric), 2) AS double precision) AS volume_growth_pct
FROM volume_by_day cur LEFT JOIN volume_by_day prev ON prev.rn = 2 WHERE cur.rn = 1;
"""

Q_MARKET_SENTIMENT = """
WITH latest_news_date AS (
    -- Lấy ngày mới nhất có tin tức trong database
    SELECT MAX(published_on::date) AS max_date 
    FROM fact_news 
    WHERE published_on IS NOT NULL
),
sentiment_values AS (
    SELECT 
        -- Chuyển đổi text sentiment thành điểm số
        CASE 
            WHEN UPPER(sentiment) = 'POSITIVE' THEN 1 
            WHEN UPPER(sentiment) = 'NEGATIVE' THEN -1 
            ELSE 0 
        END AS calculated_score
    FROM fact_news f
    JOIN latest_news_date lnd ON f.published_on::date = lnd.max_date
)
SELECT
    -- Tính trung bình cộng của các điểm số
    CAST(ROUND(AVG(calculated_score)::numeric, 4) AS double precision) AS average_sentiment_score,
    -- Gán nhãn dựa trên điểm trung bình
    CASE 
        WHEN AVG(calculated_score) >= 0.05 THEN 'Positive' 
        WHEN AVG(calculated_score) <= -0.05 THEN 'Negative' 
        ELSE 'Neutral' 
    END AS market_sentiment_label
FROM sentiment_values;
"""

# Q_COIN_SPARKLINES_7D = """
# WITH latest_date AS (SELECT MAX(date_id) AS max_date_id FROM fact_price_history),
# recent_prices AS (
#     SELECT f.coin_id, f.close, d.full_date
#     FROM fact_price_history f JOIN dim_dates d ON f.date_id = d.date_id
#     JOIN latest_date ld ON f.date_id >= (ld.max_date_id - 6) AND f.date_id <= ld.max_date_id
# )
# SELECT coin_id, ARRAY_AGG(close ORDER BY full_date ASC) AS sparkline_prices
# FROM recent_prices GROUP BY coin_id;
# """

Q_MARKET_CHANGE_7D = """
WITH market_cap_by_day AS (
    SELECT d.full_date, SUM(mc.value) FILTER (WHERE LOWER(mc.currency_id) = 'usd') AS total_cap_usd,
           ROW_NUMBER() OVER (ORDER BY d.full_date DESC) AS rn
    FROM fact_market_cap mc JOIN fact_market_global g ON g.market_id = mc.market_id
    JOIN dim_dates d ON d.date_id = g.date_id GROUP BY d.full_date
)
SELECT CAST(ROUND(CAST(((cur.total_cap_usd - prev.total_cap_usd) / NULLIF(prev.total_cap_usd, 0)) * 100.0 AS numeric), 2) AS double precision) AS change_pct_market_7d
FROM market_cap_by_day cur LEFT JOIN market_cap_by_day prev ON prev.rn = 8 WHERE cur.rn = 1;
"""

Q_MARKET_CHANGE_30D = """
WITH market_cap_by_day AS (
    SELECT d.full_date, SUM(mc.value) FILTER (WHERE LOWER(mc.currency_id) = 'usd') AS total_cap_usd,
           ROW_NUMBER() OVER (ORDER BY d.full_date DESC) AS rn
    FROM fact_market_cap mc JOIN fact_market_global g ON g.market_id = mc.market_id
    JOIN dim_dates d ON d.date_id = g.date_id GROUP BY d.full_date
)
SELECT CAST(ROUND(CAST(((cur.total_cap_usd - prev.total_cap_usd) / NULLIF(prev.total_cap_usd, 0)) * 100.0 AS numeric), 2) AS double precision) AS change_pct_market_30d
FROM market_cap_by_day cur LEFT JOIN market_cap_by_day prev ON prev.rn = 31 WHERE cur.rn = 1;
"""

Q_MARKET_CAP_GROWTH_CALCULATED = """
WITH market_cap_by_day AS (
    SELECT d.full_date, SUM(mc.value) FILTER (WHERE LOWER(mc.currency_id) = 'usd') AS total_cap_usd,
           ROW_NUMBER() OVER (ORDER BY d.full_date DESC) AS rn
    FROM fact_market_cap mc
    JOIN fact_market_global g ON g.market_id = mc.market_id
    JOIN dim_dates d ON d.date_id = g.date_id
    GROUP BY d.full_date
)
SELECT CAST(ROUND(CAST(((cur.total_cap_usd - prev.total_cap_usd) / NULLIF(prev.total_cap_usd, 0)) * 100.0 AS numeric), 2) AS double precision) AS change_pct_market_cap_calc
FROM market_cap_by_day cur
LEFT JOIN market_cap_by_day prev ON prev.rn = 2
WHERE cur.rn = 1;
"""

# =============================================
# NHÓM 2: CHI TIẾT COIN
# =============================================

Q_COIN_DETAIL_ALL_METRICS = """
WITH coin_metrics_with_lag AS (
    SELECT 
        d.full_date,
        m.coin_id, -- Thêm
        m.price_usd,
        m.market_cap_usd,
        m.volume24,
        m.csupply,
        m.tsupply,
        m.msupply,
        LAG(m.market_cap_usd, 1) OVER (PARTITION BY m.coin_id ORDER BY d.full_date ASC) as prev_market_cap,
        LAG(m.volume24, 1) OVER (PARTITION BY m.coin_id ORDER BY d.full_date ASC) as prev_volume24
    FROM fact_coin_metrics m
    JOIN dim_dates d ON m.date_id = d.date_id
    WHERE 
        m.coin_id = %(coin_id)s
)
SELECT
    m.market_cap_usd,
    m.price_usd, -- Thêm giá
    CAST(ROUND(CAST(((m.market_cap_usd - m.prev_market_cap) / NULLIF(m.prev_market_cap, 0)) * 100.0 AS numeric), 2) AS double precision) AS market_cap_change_pct_24h,
    m.volume24,
    CAST(ROUND(CAST(((m.volume24 - m.prev_volume24) / NULLIF(m.prev_volume24, 0)) * 100.0 AS numeric), 2) AS double precision) AS volume_change_pct_24h,
    CAST(m.price_usd * COALESCE(m.msupply, m.tsupply) AS double precision) AS fdv,
    CAST(m.volume24 / NULLIF(m.market_cap_usd, 0) AS double precision) AS vol_per_mkt_cap_24h,
    m.tsupply AS total_supply,
    m.msupply AS max_supply,
    m.csupply AS circulating_supply
FROM 
    coin_metrics_with_lag m
ORDER BY
    m.full_date DESC
LIMIT 1;
"""

# Lấy dữ liệu HÀNG NGÀY (cho 1D, 1W, 1M)
Q_COIN_HISTORY_DAILY = """
SELECT 
    d.full_date AS date, 
    COALESCE(f.open, 0) as open, 
    COALESCE(f.high, 0) as high, 
    COALESCE(f.low, 0) as low, 
    COALESCE(f.close, 0) as close, 
    COALESCE(f.volume, 0) as volume
FROM fact_price_history f
JOIN dim_dates d ON f.date_id = d.date_id
WHERE f.coin_id = %(coin_id)s 
  AND d.full_date >= %(start_date)s
ORDER BY d.full_date ASC;
"""

# Query cho biểu đồ tuần (Weekly)
Q_COIN_HISTORY_WEEKLY = """
WITH weekly_data AS (
    SELECT
        date_trunc('week', d.full_date) AS week_start,
        d.full_date,
        f.open, f.high, f.low, f.close, f.volume,
        ROW_NUMBER() OVER(PARTITION BY date_trunc('week', d.full_date) ORDER BY d.full_date ASC) as rn_asc,
        ROW_NUMBER() OVER(PARTITION BY date_trunc('week', d.full_date) ORDER BY d.full_date DESC) as rn_desc
    FROM fact_price_history f
    JOIN dim_dates d ON f.date_id = d.date_id
    WHERE f.coin_id = %(coin_id)s 
      AND d.full_date >= %(start_date)s
)
SELECT
    week_start AS date,
    MAX(open) FILTER (WHERE rn_asc = 1) as open,
    MAX(high) as high,
    MIN(low) as low,
    MAX(close) FILTER (WHERE rn_desc = 1) as close,
    SUM(volume) as volume
FROM weekly_data
GROUP BY week_start
ORDER BY week_start ASC;
"""

# Query cho biểu đồ tháng (Monthly)
Q_COIN_HISTORY_MONTHLY = """
WITH monthly_data AS (
    SELECT
        date_trunc('month', d.full_date) AS month_start,
        d.full_date,
        f.open, f.high, f.low, f.close, f.volume,
        ROW_NUMBER() OVER(PARTITION BY date_trunc('month', d.full_date) ORDER BY d.full_date ASC) as rn_asc,
        ROW_NUMBER() OVER(PARTITION BY date_trunc('month', d.full_date) ORDER BY d.full_date DESC) as rn_desc
    FROM fact_price_history f
    JOIN dim_dates d ON f.date_id = d.date_id
    WHERE f.coin_id = %(coin_id)s 
      AND d.full_date >= %(start_date)s
)
SELECT
    month_start AS date,
    MAX(open) FILTER (WHERE rn_asc = 1) as open,
    MAX(high) as high,
    MIN(low) as low,
    MAX(close) FILTER (WHERE rn_desc = 1) as close,
    SUM(volume) as volume
FROM monthly_data
GROUP BY month_start
ORDER BY month_start ASC;
"""

# Sparklines cho Dashboard (Top 100)
Q_COIN_SPARKLINES_7D = """
WITH latest_date AS (SELECT MAX(date_id) AS max_date_id FROM fact_price_history),
recent_prices AS (
    SELECT f.coin_id, f.close, d.full_date
    FROM fact_price_history f 
    JOIN dim_dates d ON f.date_id = d.date_id
    JOIN latest_date ld ON f.date_id >= (ld.max_date_id - 6) AND f.date_id <= ld.max_date_id
)
SELECT coin_id, ARRAY_AGG(close ORDER BY full_date ASC) AS sparkline_prices
FROM recent_prices 
GROUP BY coin_id;
"""

Q_COIN_DETAIL_NEWS = """
SELECT 
    title, 
    published_on, 
    url, 
    source_id, 
    sentiment, 
    score, 
    keywords  -- <--- BỔ SUNG DÒNG NÀY
FROM fact_news
WHERE (LOWER(title) LIKE '%%' || LOWER(%(coin_id)s) || '%%' OR LOWER(keywords) LIKE '%%' || LOWER(%(coin_id)s) || '%%')
ORDER BY published_on DESC LIMIT 10;
"""

Q_COIN_SPARKLINE = """
SELECT 
    d.full_date AS date, 
    f.close AS price
FROM fact_price_history f
JOIN dim_dates d ON f.date_id = d.date_id
WHERE f.coin_id = %(coin_id)s
ORDER BY d.full_date DESC
LIMIT 30; -- Lấy 30 điểm dữ liệu gần nhất
"""

Q_LATEST_MARKET_NEWS = """
SELECT 
    news_id,
    title,
    published_on,
    url,
    source_id,
    sentiment,
    score, -- <--- THÊM DÒNG NÀY
    keywords
FROM fact_news
ORDER BY published_on DESC
LIMIT 20;
"""