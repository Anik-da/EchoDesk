import subprocess
from ai_runtime.base import BaseAIRuntime
from hardware.gpu import get_nvidia_telemetry

class CUDARuntime(BaseAIRuntime):
    """NVIDIA CUDA / TensorRT AI runtime acceleration provider."""

    def __init__(self):
        super().__init__(
            provider_name="NVIDIA CUDA Execution Provider",
            device_type="GPU",
            description="NVIDIA CUDA GPU tensor core acceleration"
        )
        self._checked = False
        self._available = False
        self._gpu_name = None

    def _check_hardware(self):
        if not self._checked:
            telemetry = get_nvidia_telemetry()
            if telemetry:
                self._available = True
                self._gpu_name = telemetry[0].get("name", "NVIDIA GPU")
            self._checked = True

    def is_available(self) -> bool:
        self._check_hardware()
        return self._available

    def get_status(self) -> dict:
        self._check_hardware()
        return {
            "provider": self.provider_name if self._available else "CUDA (Not Available)",
            "device_type": self.device_type,
            "available": self._available,
            "supported": self._available,
            "gpu_name": self._gpu_name,
            "npu_available": False,
            "qnn_available": False,
            "reason": None if self._available else "No NVIDIA GPU or CUDA runtime detected"
        }
