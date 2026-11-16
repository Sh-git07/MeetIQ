"""
Tavily Search API Client.
Executes targeted web research, handles rate limits, canonical URL deduplication,
and normalizes search results with full source provenance.
"""

import logging
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode
import httpx

from ai_engine.config import config
from ai_engine.schemas import NormalizedSource

logger = logging.getLogger("ai_engine.tavily")


class TavilyError(Exception):
    """Base exception for Tavily client errors."""
    pass


class TavilyAuthError(TavilyError):
    """Raised when Tavily authentication fails."""
    pass


class TavilyRateLimitError(TavilyError):
    """Raised when Tavily rate limit is exceeded."""
    pass


class TavilyClient:
    """Client for Tavily Search API with deduplication and metadata normalization."""

    API_URL = "https://api.tavily.com/search"

    def __init__(
        self,
        api_key: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self.api_key = api_key if api_key is not None else config.tavily_api_key
        self.timeout = timeout or config.request_timeout_seconds
        self.max_retries = max_retries or config.max_retries

    @staticmethod
    def canonicalize_url(raw_url: str) -> str:
        """
        Normalize URL for reliable deduplication:
        Strips tracking parameters (utm_*, fbclid, etc.), lowercases scheme & host,
        strips leading www., and trims trailing slashes.
        """
        if not raw_url:
            return ""
        try:
            parsed = urlparse(raw_url.strip())
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            # Filter out tracking query params
            filtered_params = [
                (k, v) for k, v in parse_qsl(parsed.query)
                if not (k.startswith("utm_") or k in {"ref", "fbclid", "gclid", "ocid", "source"})
            ]
            new_query = urlencode(filtered_params)
            path = parsed.path.rstrip("/") if parsed.path != "/" else "/"
            clean_url = urlunparse((
                parsed.scheme.lower(),
                netloc,
                path,
                parsed.params,
                new_query,
                ""  # drop fragment
            ))
            return clean_url
        except Exception:
            return raw_url.strip()

    @staticmethod
    def extract_domain(url: str) -> str:
        """Extract clean domain/publisher name from URL."""
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc.lower()
            if netloc.startswith("www."):
                netloc = netloc[4:]
            return netloc
        except Exception:
            return "Web Source"

    def search(
        self,
        query: str,
        search_depth: str = "basic",
        max_results: int = 5,
        topic: str = "news",
        days: Optional[int] = 30,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Execute raw search against Tavily API with retries and exponential backoff.
        """
        if not self.api_key:
            raise TavilyAuthError("Tavily API key is not configured.")

        payload: Dict[str, Any] = {
            "api_key": self.api_key,
            "query": query,
            "search_depth": search_depth,
            "max_results": max_results,
            "topic": topic,
        }
        if days is not None and topic == "news":
            payload["days"] = days
        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
        }

        backoff = 1.0
        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(self.API_URL, headers=headers, json=payload)

                if response.status_code in (401, 403):
                    error_msg = f"Tavily authentication failed ({response.status_code}): {response.text}"
                    logger.error(error_msg)
                    raise TavilyAuthError(error_msg)

                if response.status_code == 429:
                    if attempt == self.max_retries:
                        raise TavilyRateLimitError(f"Tavily rate limit exceeded after {attempt} attempts: {response.text}")
                    logger.warning(f"Tavily rate limit (429). Retrying in {backoff:.1f}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
                    continue

                if response.status_code >= 500:
                    if attempt == self.max_retries:
                        response.raise_for_status()
                    logger.warning(f"Tavily server error ({response.status_code}). Retrying in {backoff:.1f}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
                    continue

                response.raise_for_status()
                data = response.json()
                return data.get("results", [])

            except (httpx.TimeoutException, httpx.NetworkError) as e:
                logger.warning(f"Tavily network/timeout error on attempt {attempt}/{self.max_retries}: {e}")
                if attempt == self.max_retries:
                    raise TavilyError(f"Tavily connection failed after {self.max_retries} attempts: {e}") from e
                time.sleep(backoff)
                backoff *= 2.0
            except TavilyError:
                raise
            except Exception as e:
                logger.error(f"Unexpected Tavily search error: {e}")
                if attempt == self.max_retries:
                    raise TavilyError(f"Tavily search request failed: {e}") from e
                time.sleep(backoff)
                backoff *= 2.0

        return []

    def search_and_normalize(
        self,
        query: str,
        id_counter_start: int = 1,
        existing_urls: Optional[set] = None,
        max_results: int = 5,
        topic: str = "news",
        days: int = 30,
    ) -> List[NormalizedSource]:
        """
        Execute search and return deduplicated NormalizedSource items.
        """
        seen_urls = existing_urls if existing_urls is not None else set()
        raw_results = self.search(
            query=query,
            max_results=max_results,
            topic=topic,
            days=days,
        )

        normalized_list: List[NormalizedSource] = []
        current_id = id_counter_start

        for item in raw_results:
            raw_url = item.get("url", "")
            if not raw_url:
                continue

            canonical_url = self.canonicalize_url(raw_url)
            if canonical_url in seen_urls:
                continue

            seen_urls.add(canonical_url)
            source_id = f"src_{current_id:03d}"
            current_id += 1

            published_date = item.get("published_date")
            clean_date = published_date.split("T")[0] if published_date and "T" in published_date else published_date

            normalized_list.append(
                NormalizedSource(
                    source_id=source_id,
                    title=item.get("title", "").strip() or "Untitled Source",
                    url=canonical_url,
                    publisher=self.extract_domain(canonical_url),
                    published_at=clean_date if clean_date else None,
                    content=item.get("content", "").strip(),
                    is_date_verified=bool(clean_date),
                )
            )

        return normalized_list
