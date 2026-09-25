import sys
import os
import importlib.util

# Load the real standard library platform module to avoid shadowing
_real_platform = None
for p in sys.path:
    candidate = os.path.join(p, "platform.py")
    if os.path.isfile(candidate):
        spec = importlib.util.spec_from_file_location("_real_platform", candidate)
        if spec and spec.loader:
            _real_platform = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(_real_platform)
            break

if _real_platform:
    for attr in dir(_real_platform):
        if not attr.startswith("__"):
            globals()[attr] = getattr(_real_platform, attr)

from platform.base import PlatformBase, CapabilityState
from platform.windows import WindowsPlatform
from platform.macos import MacOSPlatform
from platform.linux import LinuxPlatform

_current_adapter = None

def get_platform_adapter() -> PlatformBase:
    """Returns the platform adapter instance matching the active operating system."""
    global _current_adapter
    if _current_adapter is None:
        if sys.platform == "win32":
            _current_adapter = WindowsPlatform()
        elif sys.platform == "darwin":
            _current_adapter = MacOSPlatform()
        else:
            _current_adapter = LinuxPlatform()
    return _current_adapter

__all__ = [
    "PlatformBase",
    "CapabilityState",
    "WindowsPlatform",
    "MacOSPlatform",
    "LinuxPlatform",
    "get_platform_adapter"
]
