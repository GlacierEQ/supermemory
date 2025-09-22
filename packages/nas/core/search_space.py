"""Search space and configuration sampling for NAS."""
from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Dict, List

# Define the search space for architectures
SEARCH_SPACE: Dict[str, List] = {
    "hidden_dim": [4, 8, 16],
    "learning_rate": [0.1, 0.01, 0.001],
    "epochs": [100, 200],
}


@dataclass
class Architecture:
    """Configuration for a candidate neural network."""
    hidden_dim: int
    learning_rate: float
    epochs: int


def sample_architecture() -> Architecture:
    """Randomly sample an architecture from the search space."""
    return Architecture(
        hidden_dim=random.choice(SEARCH_SPACE["hidden_dim"]),
        learning_rate=random.choice(SEARCH_SPACE["learning_rate"]),
        epochs=random.choice(SEARCH_SPACE["epochs"]),
    )
