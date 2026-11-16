import threading

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from config import settings

_pool: ConnectionPool | None = None
_pool_lock = threading.Lock()


def open_pool() -> ConnectionPool:
    """Reuse connections. A fresh connection to the hosted database costs about a second."""
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = ConnectionPool(
                    settings.database_url,
                    min_size=1,
                    max_size=4,
                    kwargs={"autocommit": True, "row_factory": dict_row},
                    open=True,
                )
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


def connect():
    return open_pool().connection()


def _email(email: str) -> str:
    return email.strip().lower()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------


def create_user(email: str, name: str, password_hash: str) -> dict | None:
    """Insert a user. Returns None when the email is already registered."""
    with connect() as conn:
        try:
            return conn.execute(
                """
                insert into users (email, name, password_hash)
                values (%s, %s, %s)
                returning id, email, name
                """,
                (_email(email), name.strip(), password_hash),
            ).fetchone()
        except psycopg.errors.UniqueViolation:
            return None


def get_user_by_email(email: str) -> dict | None:
    """User row including password_hash, for login only."""
    with connect() as conn:
        return conn.execute(
            """
            select id, email, name, password_hash
            from users
            where lower(email) = %s and is_active
            """,
            (_email(email),),
        ).fetchone()


def get_user_by_id(user_id: int) -> dict | None:
    with connect() as conn:
        return conn.execute(
            """
            select id, email, name
            from users
            where id = %s and is_active
            """,
            (user_id,),
        ).fetchone()


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------


def start_event(gmail_message_id: str) -> dict | None:
    """Claim a message. Returns None when it is already handled or in progress."""
    with connect() as conn:
        return conn.execute(
            """
            insert into events (gmail_message_id) values (%s)
            on conflict (gmail_message_id) do update
              set attempts = events.attempts + 1, status = 'processing', error = null
              where events.status = 'failed'
            returning id, attempts
            """,
            (gmail_message_id,),
        ).fetchone()


def finish_event(event_id: int, status: str, result: dict) -> None:
    with connect() as conn:
        conn.execute(
            "update events set status = %s, result = %s, processed_at = now() where id = %s",
            (status, Jsonb(result), event_id),
        )


def fail_event(event_id: int, error: str) -> None:
    with connect() as conn:
        conn.execute(
            "update events set status = 'failed', error = %s where id = %s",
            (error, event_id),
        )


def upsert_ticket(gmail_thread_id: str, customer_email: str, subject: str) -> int:
    with connect() as conn:
        row = conn.execute(
            """
            insert into tickets (gmail_thread_id, customer_email, subject)
            values (%s, %s, %s)
            on conflict (gmail_thread_id) do update set updated_at = now()
            returning id
            """,
            (gmail_thread_id, customer_email, subject),
        ).fetchone()
        return row["id"]


def update_ticket(
    ticket_id: int, status: str, category: str | None = None, proposed_action: str | None = None
) -> None:
    with connect() as conn:
        conn.execute(
            """
            update tickets
            set status = %s, category = coalesce(%s, category),
                proposed_action = %s, updated_at = now()
            where id = %s
            """,
            (status, category, proposed_action, ticket_id),
        )


def save_message(
    ticket_id: int, gmail_message_id: str, direction: str, from_address: str, body: str
) -> None:
    with connect() as conn:
        conn.execute(
            """
            insert into messages (ticket_id, gmail_message_id, direction, from_address, body)
            values (%s, %s, %s, %s, %s)
            on conflict (gmail_message_id) do nothing
            """,
            (ticket_id, gmail_message_id, direction, from_address, body),
        )


def list_sections() -> list[str]:
    with connect() as conn:
        rows = conn.execute("select distinct section from knowledge_base order by section").fetchall()
        return [row["section"] for row in rows]


def get_section(section: str) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select title, content from knowledge_base where section = %s order by id",
            (section,),
        ).fetchall()

def list_events(limit: int = 100) -> list[dict]:
    with connect() as conn:
        return conn.execute("select * from events order by id desc limit %s", (limit,)).fetchall()


def list_tickets(limit: int = 100) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select * from tickets order by updated_at desc limit %s", (limit,)
        ).fetchall()


def list_messages(ticket_id: int) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select * from messages where ticket_id = %s order by id", (ticket_id,)
        ).fetchall()


def list_knowledge_base() -> list[dict]:
    with connect() as conn:
        return conn.execute("select * from knowledge_base order by section, id").fetchall()


def update_knowledge_base_entry(entry_id: int, title: str, content: str) -> dict | None:
    with connect() as conn:
        return conn.execute(
            """
            update knowledge_base set title = %s, content = %s, updated_at = now()
            where id = %s returning *
            """,
            (title, content, entry_id),
        ).fetchone()
