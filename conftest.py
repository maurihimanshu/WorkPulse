"""Configure pytest for WorkPulse."""

import sys
from pathlib import Path

project_root = Path(__file__).parent.resolve()
for path_str in (str(project_root / "collector"), str(project_root)):
    if path_str not in sys.path:
        sys.path.insert(0, path_str)