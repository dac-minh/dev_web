import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
from typing import Any # Import Any

load_dotenv()

PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_DB   = os.getenv("PG_DB", "data")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PW   = os.getenv("PG_PASSWORD", "151104")

def get_conn():
    return psycopg2.connect(
        host=PG_HOST, port=PG_PORT, dbname=PG_DB, user=PG_USER, password=PG_PW
    )

# Sửa type hint của params để chấp nhận cả dict (Any)
def fetch_all(query: str, params: Any = None): 
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchall()

def fetch_one(query: str, params: Any = None):
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return cur.fetchone()