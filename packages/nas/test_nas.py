"""Tests for NAS module using unittest."""
from __future__ import annotations

import os
import unittest

from . import Architecture, SEARCH_SPACE, sample_architecture, search
from .utils.config import DEFAULT_RESULTS_PATH


class TestNAS(unittest.TestCase):
    def test_sample_architecture(self) -> None:
        cfg = sample_architecture()
        self.assertIn(cfg.hidden_dim, SEARCH_SPACE["hidden_dim"])
        self.assertIn(cfg.learning_rate, SEARCH_SPACE["learning_rate"])
        self.assertIn(cfg.epochs, SEARCH_SPACE["epochs"])

    def test_search_returns_best(self) -> None:
        cfg, loss = search(5)
        self.assertIsInstance(cfg, Architecture)
        self.assertGreaterEqual(loss, 0)

    def test_env_iteration_and_persistence(self) -> None:
        os.environ["NAS_ITERATIONS"] = "1"
        results_path = DEFAULT_RESULTS_PATH
        if results_path.exists():
            results_path.unlink()
        cfg, loss = search()
        self.assertTrue(results_path.exists())
        data = results_path.read_text()
        self.assertIn(str(cfg.hidden_dim), data)
        results_path.unlink()
        del os.environ["NAS_ITERATIONS"]

    def test_parallel_backends(self) -> None:
        os.environ["NAS_BACKEND"] = "thread"
        cfg, loss = search(2)
        self.assertIsInstance(cfg, Architecture)
        self.assertGreaterEqual(loss, 0)
        os.environ["NAS_BACKEND"] = "process"
        cfg2, loss2 = search(2)
        self.assertIsInstance(cfg2, Architecture)
        self.assertGreaterEqual(loss2, 0)
        del os.environ["NAS_BACKEND"]


if __name__ == "__main__":
    unittest.main()
