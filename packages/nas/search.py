"""Search algorithm for discovering optimal architectures."""
from __future__ import annotations

from typing import Tuple

from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor

from .utils.config import get_backend, get_iterations, persist_result
from .core.model import train_xor
from .core.search_space import Architecture, sample_architecture


def search(iterations: int | None = None, backend: str | None = None) -> Tuple[Architecture, float]:
    """Run NAS for a number of iterations and return best architecture."""
    iters = iterations if iterations is not None else get_iterations()
    backend = backend or get_backend()
    configs = [sample_architecture() for _ in range(iters)]
    if backend == "sequential":
        losses = [train_xor(cfg) for cfg in configs]
    else:
        Executor = ThreadPoolExecutor if backend == "thread" else ProcessPoolExecutor
        with Executor() as ex:
            losses = list(ex.map(train_xor, configs))
    results = list(zip(configs, losses))
    best_config, best_loss = min(results, key=lambda x: x[1])
    persist_result(best_config, best_loss)
    return best_config, best_loss


if __name__ == "__main__":
    cfg, score = search()
    print("Best architecture:", cfg)
    print("Loss:", score)
