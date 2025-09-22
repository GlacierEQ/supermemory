"""Configuration helpers for the NAS module."""
from __future__ import annotations

import json
import os
from pathlib import Path

from ..core.search_space import Architecture

DEFAULT_ITERATIONS = 10
DEFAULT_RESULTS_PATH = Path("nas_results.json")
DEFAULT_BACKEND = "sequential"


def get_iterations() -> int:
    """Number of NAS iterations, configurable via NAS_ITERATIONS env var."""
    try:
        return int(os.getenv("NAS_ITERATIONS", DEFAULT_ITERATIONS))
    except ValueError:
        return DEFAULT_ITERATIONS


def get_backend() -> str:
    """Return backend type for NAS, defaults to sequential."""
    backend = os.getenv("NAS_BACKEND", DEFAULT_BACKEND).lower()
    if backend in {"thread", "process"}:
        return backend
    return DEFAULT_BACKEND


def persist_result(config: Architecture, loss: float, path: Path | None = None) -> None:
    """Persist best architecture and loss to JSON file."""
    result_path = path or DEFAULT_RESULTS_PATH
    result_path.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "hidden_dim": config.hidden_dim,
        "learning_rate": config.learning_rate,
        "epochs": config.epochs,
        "loss": loss,
    }
    with result_path.open("w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
