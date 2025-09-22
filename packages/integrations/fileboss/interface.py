"""FileBoss integration layer.

Provides an interface for interacting with the FileBoss
repository and orchestrating file operations required by the
system. The implementation is intentionally lightweight and
serves as a placeholder for future expansion.
"""
from dataclasses import dataclass
from pathlib import Path


@dataclass
class FileBossInterface:
    """High level wrapper around FileBoss utilities.

    Attributes
    ----------
    repo_path: Path to the FileBoss repository checkout.
    """

    repo_path: Path

    def list_evidence(self) -> list[Path]:
        """Return a list of evidence files discovered by FileBoss.

        This stub simply scans the repository for files under an
        ``evidence`` directory. Real deployments are expected to
        provide richer metadata and filtering.
        """
        evidence_dir = self.repo_path / "evidence"
        if not evidence_dir.exists():
            return []
        return [p for p in evidence_dir.rglob("*") if p.is_file()]
