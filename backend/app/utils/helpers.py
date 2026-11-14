import uuid
from datetime import datetime, timezone
from typing import Optional


def generate_id(prefix: str) -> str:
    """Generate a clean, readable unique identifier like meet_a1b2c3d4."""
    short_uuid = uuid.uuid4().hex[:8]
    return f"{prefix}_{short_uuid}"


def parse_datetime(dt_input: str) -> datetime:
    """Parse ISO 8601 string to naive UTC datetime for database storage."""
    if isinstance(dt_input, datetime):
        return dt_input
    clean_str = dt_input.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean_str)
    # Convert to UTC naive if timezone-aware
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def format_iso(dt: Optional[datetime]) -> Optional[str]:
    """Format datetime to ISO 8601 string ending with Z."""
    if dt is None:
        return None
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
