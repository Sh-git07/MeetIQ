import asyncio
import json
import logging
from typing import Dict, List, Set, Optional, Any

logger = logging.getLogger("meetiq.research_manager")


class ResearchStreamManager:
    """
    Manages in-memory pub/sub queues and event replay history
    for Server-Sent Events (SSE) research streams.
    """

    def __init__(self):
        # Maps research_id -> Set of asyncio.Queue
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        # Maps research_id -> List of historical events (for replay on reconnect)
        self._history: Dict[str, List[Dict[str, Any]]] = {}
        # Maps research_id -> boolean terminal flag
        self._completed: Dict[str, bool] = {}
        self._lock = asyncio.Lock()

    async def register_subscriber(self, research_id: str) -> asyncio.Queue:
        """Register a new SSE client queue for a research session."""
        async with self._lock:
            if research_id not in self._subscribers:
                self._subscribers[research_id] = set()
            if research_id not in self._history:
                self._history[research_id] = []

            queue: asyncio.Queue = asyncio.Queue()
            self._subscribers[research_id].add(queue)

            # Replay all past events so client immediately catches up
            for event in self._history[research_id]:
                await queue.put(event)

            # If already completed or failed, push None sentinel to trigger clean exit
            if self._completed.get(research_id, False):
                await queue.put(None)

            logger.info(f"Subscribed client to research stream: {research_id} (active: {len(self._subscribers[research_id])})")
            return queue

    async def remove_subscriber(self, research_id: str, queue: asyncio.Queue) -> None:
        """Remove an SSE client queue upon disconnection."""
        async with self._lock:
            if research_id in self._subscribers:
                self._subscribers[research_id].discard(queue)
                if not self._subscribers[research_id] and self._completed.get(research_id, False):
                    # Clean up completed sessions when no subscribers remain
                    pass
            logger.info(f"Unsubscribed client from research stream: {research_id}")

    async def broadcast_event(self, research_id: str, event_data: Dict[str, Any]) -> None:
        """Broadcast an event to all connected clients and store in history."""
        async with self._lock:
            if research_id not in self._history:
                self._history[research_id] = []
            self._history[research_id].append(event_data)

            stage = event_data.get("stage")
            is_terminal = stage in ("completed", "failed")
            if is_terminal:
                self._completed[research_id] = True

            queues = list(self._subscribers.get(research_id, []))

        # Push outside lock to avoid blocking
        for q in queues:
            await q.put(event_data)
            if is_terminal:
                await q.put(None)  # Sentinel to close generator

        logger.debug(f"Broadcasted event for {research_id}: stage={stage}, progress={event_data.get('progress')}")

    def get_history(self, research_id: str) -> List[Dict[str, Any]]:
        """Return the event history for a given research session."""
        return self._history.get(research_id, [])


# Global singleton instance
stream_manager = ResearchStreamManager()
