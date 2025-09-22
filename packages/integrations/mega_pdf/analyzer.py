"""MEGA-PDF document analysis integration."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class MegaPDFAnalyzer:
    """Thin wrapper around MEGA-PDF analysis routines.

    The real project performs OCR, clause detection and other
    legal-oriented PDF inspection. This class exposes a small
    subset of that behaviour for demonstration purposes.
    """

    def extract_text(self, pdf: Path) -> str:
        """Extract plain text from ``pdf``.

        The implementation currently reads the file assuming it is
        UTF-8 encoded text and returns the contents. Future
        versions should replace this with a call into MEGA-PDF's OCR
        pipeline.
        """
        return pdf.read_text(encoding="utf-8", errors="ignore")
