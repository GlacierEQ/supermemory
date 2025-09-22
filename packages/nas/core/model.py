"""Model utilities for the NAS module."""
from __future__ import annotations

import random
from typing import List, Tuple

from .search_space import Architecture

Matrix = List[List[float]]


def _zeros(rows: int, cols: int) -> Matrix:
    return [[0.0 for _ in range(cols)] for _ in range(rows)]


def matmul(a: Matrix, b: Matrix) -> Matrix:
    """Multiply two matrices represented as lists of lists."""

    if not a or not b:
        raise ValueError("matrices must be non-empty")

    rows_a, cols_a = len(a), len(a[0])
    rows_b, cols_b = len(b), len(b[0])

    if cols_a != rows_b:
        raise ValueError("incompatible matrix shapes")

    result = _zeros(rows_a, cols_b)
    for i in range(rows_a):
        for k in range(cols_a):
            aik = a[i][k]
            if aik == 0:
                continue
            for j in range(cols_b):
                result[i][j] += aik * b[k][j]
    return result


def transpose(matrix: Matrix) -> Matrix:
    if not matrix:
        return []
    cols = len(matrix[0])
    return [[matrix[row][col] for row in range(len(matrix))] for col in range(cols)]


def relu(matrix: Matrix) -> Tuple[Matrix, Matrix]:
    activated = _zeros(len(matrix), len(matrix[0]))
    mask = _zeros(len(matrix), len(matrix[0]))
    for i, row in enumerate(matrix):
        for j, value in enumerate(row):
            if value > 0:
                activated[i][j] = value
                mask[i][j] = 1.0
    return activated, mask


def mean_squared_error(pred: Matrix, target: Matrix) -> float:
    total = 0.0
    count = 0
    for pred_row, target_row in zip(pred, target):
        for pred_value, target_value in zip(pred_row, target_row):
            diff = pred_value - target_value
            total += diff * diff
            count += 1
    return total / max(count, 1)


def init_weights(input_dim: int, hidden_dim: int, output_dim: int) -> Tuple[Matrix, Matrix]:
    """Initialise weights for a single-hidden-layer network."""

    rng = random.Random()
    w1 = [[rng.normalvariate(0.0, 0.1) for _ in range(hidden_dim)] for _ in range(input_dim)]
    w2 = [[rng.normalvariate(0.0, 0.1) for _ in range(output_dim)] for _ in range(hidden_dim)]
    return w1, w2


def forward(x: Matrix, w1: Matrix, w2: Matrix) -> Tuple[Matrix, Matrix, Matrix]:
    """Forward pass returning hidden activation, output, and ReLU mask."""

    hidden_linear = matmul(x, w1)
    hidden_activation, relu_mask = relu(hidden_linear)
    y_hat = matmul(hidden_activation, w2)
    return hidden_activation, y_hat, relu_mask


XOR_INPUTS: Matrix = [[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]]
XOR_TARGETS: Matrix = [[0.0], [1.0], [1.0], [0.0]]


def train_xor(config: Architecture) -> float:
    """Train a network for the XOR task and return final loss."""

    x = XOR_INPUTS
    y = XOR_TARGETS

    w1, w2 = init_weights(2, config.hidden_dim, 1)

    last_loss = 0.0
    for _ in range(config.epochs):
        hidden, y_hat, relu_mask = forward(x, w1, w2)
        last_loss = mean_squared_error(y_hat, y)

        grad_y = [[2.0 * (y_hat[i][0] - y[i][0]) / len(y)] for i in range(len(y))]
        grad_w2 = matmul(transpose(hidden), grad_y)
        grad_h = matmul(grad_y, transpose(w2))
        for i in range(len(grad_h)):
            for j in range(len(grad_h[i])):
                grad_h[i][j] *= relu_mask[i][j]
        grad_w1 = matmul(transpose(x), grad_h)

        for i in range(len(w1)):
            for j in range(len(w1[i])):
                w1[i][j] -= config.learning_rate * grad_w1[i][j]
        for i in range(len(w2)):
            for j in range(len(w2[i])):
                w2[i][j] -= config.learning_rate * grad_w2[i][j]

    return float(last_loss)
