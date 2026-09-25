import importlib
from ai_runtime.base import BaseAIRuntime

_std_platform = importlib.import_module("platform")

class CPURuntime(BaseAIRuntime):
    """Universal on-device CPU execution provider available on all desktop platforms."""

    def __init__(self):
        super().__init__(
            provider_name="CPU (Universal Fallback)",
            device_type="CPU",
            description="Universal vector CPU execution provider"
        )

    def is_available(self) -> bool:
        return True

    def get_status(self) -> dict:
        return {
            "provider": self.provider_name,
            "device_type": self.device_type,
            "available": True,
            "supported": True,
            "npu_available": False,
            "qnn_available": False,
            "reason": None,
            "architecture": _std_platform.machine()
        }
