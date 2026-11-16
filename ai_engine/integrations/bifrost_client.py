"""
Bifrost (Maxim AI LLM Gateway) Client.
Provides OpenAI-compatible chat completions with structured JSON outputs,
bounded retries, rate-limit backoff, and robust error handling.
"""

import json
import logging
import re
import time
from typing import Any, Dict, List, Optional, Type, TypeVar
import httpx
from pydantic import BaseModel, ValidationError

from ai_engine.config import config

logger = logging.getLogger("ai_engine.bifrost")
T = TypeVar("T", bound=BaseModel)


class BifrostError(Exception):
    """Base exception for Bifrost client errors."""
    pass


class BifrostAuthError(BifrostError):
    """Raised when authentication fails (401/403)."""
    pass


class BifrostRateLimitError(BifrostError):
    """Raised when rate limit is exceeded after retries."""
    pass


class BifrostClient:
    """Client for Bifrost LLM Gateway via OpenAI-compatible endpoints."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        raw_base_url = (base_url or config.bifrost_base_url).strip()
        # Normalize endpoint to /v1/chat/completions
        if raw_base_url.endswith("/chat/completions"):
            self.endpoint = raw_base_url
        elif raw_base_url.endswith("/v1"):
            self.endpoint = f"{raw_base_url}/chat/completions"
        elif raw_base_url.endswith("/v1/"):
            self.endpoint = f"{raw_base_url}chat/completions"
        else:
            self.endpoint = f"{raw_base_url.rstrip('/')}/v1/chat/completions"

        self.api_key = api_key if api_key is not None else config.bifrost_api_key
        self.model = model or config.bifrost_model
        self.timeout = timeout or config.request_timeout_seconds
        self.max_retries = max_retries or config.max_retries

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "MeetIQ-AIEngine/1.0",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
            headers["x-bifrost-api-key"] = self.api_key
            headers["x-api-key"] = self.api_key
            headers["x-bf-vk"] = self.api_key
        return headers

    def create_chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.3,
        max_tokens: int = 2048,
        response_format: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Send a chat completion request to Bifrost with retries and backoff.
        """
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if response_format:
            payload["response_format"] = response_format

        headers = self._get_headers()
        backoff = 1.0

        for attempt in range(1, self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.post(self.endpoint, headers=headers, json=payload)

                if response.status_code in (401, 403):
                    error_msg = f"Bifrost authentication failed ({response.status_code}): {response.text}"
                    logger.error(error_msg)
                    raise BifrostAuthError(error_msg)

                if response.status_code == 429:
                    if attempt == self.max_retries:
                        raise BifrostRateLimitError(f"Bifrost rate limit exceeded after {attempt} attempts: {response.text}")
                    logger.warning(f"Bifrost rate limit (429). Retrying in {backoff:.1f}s (attempt {attempt}/{self.max_retries})")
                    time.sleep(backoff)
                    backoff *= 2.0
                    continue

                if response.status_code == 400:
                    error_msg = f"Bifrost 400 Bad Request: {response.text}"
                    logger.error(error_msg)
                    raise BifrostError(error_msg)

                if response.status_code >= 500:
                    if attempt == self.max_retries:
                        response.raise_for_status()
                    logger.warning(f"Bifrost server error ({response.status_code}). Retrying in {backoff:.1f}s...")
                    time.sleep(backoff)
                    backoff *= 2.0
                    continue

                response.raise_for_status()
                data = response.json()

                choices = data.get("choices", [])
                if not choices:
                    raise BifrostError(f"No choices returned from Bifrost completion: {data}")

                content = choices[0].get("message", {}).get("content", "")
                return content.strip()

            except (httpx.TimeoutException, httpx.NetworkError) as e:
                logger.warning(f"Bifrost network/timeout error on attempt {attempt}/{self.max_retries}: {e}")
                if attempt == self.max_retries:
                    raise BifrostError(f"Bifrost connection failed after {self.max_retries} attempts: {e}") from e
                time.sleep(backoff)
                backoff *= 2.0
            except BifrostError:
                raise
            except Exception as e:
                logger.error(f"Unexpected error calling Bifrost: {e}")
                if attempt == self.max_retries:
                    raise BifrostError(f"Bifrost request failed: {e}") from e
                time.sleep(backoff)
                backoff *= 2.0

        raise BifrostError("Bifrost request failed: maximum retries reached.")

    def generate_structured(
        self,
        messages: List[Dict[str, str]],
        schema: Type[T],
        temperature: float = 0.2,
        max_tokens: int = 2048,
        repair_attempts: int = 1,
    ) -> T:
        """
        Generate structured output adhering to a Pydantic schema with bounded JSON repair.
        """
        raw_text = self.create_chat_completion(
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )

        last_err: Optional[Exception] = None
        # Attempt to parse and validate
        try:
            cleaned = self._clean_json_string(raw_text)
            data = json.loads(cleaned)
            data = self._coerce_data_for_schema(data, schema)
            return schema.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as e:
            last_err = e
            logger.warning(f"Initial JSON parsing/validation failed: {e}. Attempting bounded repair.")

        # Bounded repair round
        for repair_idx in range(repair_attempts):
            repair_prompt = [
                *messages,
                {"role": "assistant", "content": raw_text},
                {
                    "role": "user",
                    "content": (
                        f"Your previous response was not valid JSON conforming to the schema:\n"
                        f"Validation error: {last_err}\n"
                        f"Expected JSON Schema:\n{json.dumps(schema.model_json_schema(), indent=2)}\n"
                        f"Please output ONLY valid JSON without any markdown formatting or commentary."
                    ),
                },
            ]
            try:
                repair_text = self.create_chat_completion(
                    messages=repair_prompt,
                    temperature=0.1,
                    max_tokens=max_tokens,
                    response_format={"type": "json_object"},
                )
                cleaned = self._clean_json_string(repair_text)
                data = json.loads(cleaned)
                data = self._coerce_data_for_schema(data, schema)
                return schema.model_validate(data)
            except Exception as repair_err:
                last_err = repair_err
                logger.warning(f"Repair attempt {repair_idx + 1} failed: {repair_err}")

        # If repair fails, raise BifrostError with details
        raise BifrostError(f"Failed to produce valid structured output for {schema.__name__}: {last_err}")

    @staticmethod
    def _clean_json_string(text: str) -> str:
        """Remove markdown code blocks, trailing commas, and surrounding whitespace."""
        text = text.strip()
        # Match ```json ... ``` or ``` ... ```
        pattern = r"^```(?:json)?\s*([\s\S]*?)\s*```$"
        match = re.match(pattern, text, re.IGNORECASE)
        if match:
            text = match.group(1).strip()
        # Clean trailing commas before close braces/brackets
        text = re.sub(r',\s*([}\]])', r'\1', text)
        return text

    @staticmethod
    def _coerce_data_for_schema(data: Any, schema: Type[T]) -> Any:
        """Helper to coerce raw parsed JSON to match schema expectations."""
        if isinstance(data, list):
            fields = schema.model_fields if hasattr(schema, "model_fields") else {}
            for field_name in ["developments", "queries", "verifications"]:
                if field_name in fields:
                    return {field_name: data}
        return data

