import sys
import importlib
from ai_runtime.base import BaseAIRuntime

_std_platform = importlib.import_module("platform")

class CoreMLRuntime(BaseAIRuntime):
    """Apple CoreML / Apple Neural Engine acceleration provider for macOS."""

    def __init__(self):
        super().__init__(
            provider_name="Apple CoreML / Neural Engine",
            device_type="Apple Neural Engine / GPU",
            description="Apple Neural Engine and Metal GPU hardware acceleration"
        )
        self._checked = False
        self._available = False
        self._reason = None

    def _verify_hardware(self):
        if not self._checked:
            if sys.platform != "darwin":
                self._available = False
                self._reason = "CoreML is only supported on macOS devices"
            else:
                arch = _std_platform.machine().lower()
                # On macOS Apple Silicon, CoreML / ANE is native
                if "arm" in arch or "aarch64" in arch:
                    self._available = True
                    self._reason = None
                else:
                    # Intel Mac
                    self._available = True
                    self._reason = "Intel Mac CoreML execution (CPU/Metal GPU)"
            self._checked = True

    def is_available(self) -> bool:
        self._verify_hardware()
        return self._available

    def get_status(self) -> dict:
        self._verify_hardware()
        return {
            "provider": self.provider_name if self._available else "CoreML (Not Supported)",
            "device_type": self.device_type,
            "available": self._available,
            "supported": self._available,
            "npu_available": self._available and "arm" in _std_platform.machine().lower(),
            "qnn_available": False,
            "reason": self._reason
        }
