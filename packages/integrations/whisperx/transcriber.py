"""WhisperX audio transcription interface."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class WhisperXTranscriber:
    """Minimal facade for the WhisperX transcription backend."""

    model_name: str = "large-v2"

    def transcribe(self, audio: Path) -> str:
        """Return a dummy transcription for ``audio``.

        The real implementation would call the WhisperX library and
        include speaker diarisation with word-level time stamps. For
        now we simply return an empty string to keep the integration
        lightweight.
        """
        # Placeholder for actual transcription logic
        return ""
