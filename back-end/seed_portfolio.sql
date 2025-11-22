CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    coin_id VARCHAR(50) REFERENCES fact_coin_metrics(coin_id),
    quantity DOUBLE PRECISION,
    avg_cost DOUBLE PRECISION,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adjust coin_id values to match your dataset
INSERT INTO portfolio (user_id, coin_id, quantity, avg_cost) VALUES
(1, 'bitcoin', 0.15, 35000),
(1, 'ethereum', 8.0, 1800),
(1, 'tether', 1000, 1),
(1, 'ripple', 1500, 0.35),
(1, 'solana', 50, 95)
ON CONFLICT DO NOTHING;
