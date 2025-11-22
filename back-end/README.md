# Crypto Warehouse Backend (FastAPI)

Connects to PostgreSQL `big_data` (from `warehouse.sql`) and exposes APIs for the dashboard.

## Quickstart
```bash
cd back-end
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit DB credentials if needed

# (Optional) Seed portfolio
psql -h $PG_HOST -U $PG_USER -d big_data -f seed_portfolio.sql

uvicorn main:app --reload --port 8080 
```

APIs:
- GET /api/health
- GET /api/summary
- GET /api/chart?coin_id=bitcoin&date_from=2024-01-01&date_to=2025-01-01
- GET /api/metrics/latest?coin_id=bitcoin
- GET /api/coins
- GET /api/portfolio?user_id=1
- GET /api/portfolio/summary?user_id=1
