import sqlite3

DB_NAME = "workflow.db"


def get_connection():
    return sqlite3.connect(DB_NAME, check_same_thread=False)


def init_db():

    conn = get_connection()

    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS workflows (
        request_id TEXT PRIMARY KEY,
        status TEXT,
        state_json TEXT,
        created_at TEXT
    )
    """)

    conn.commit()
    conn.close()
