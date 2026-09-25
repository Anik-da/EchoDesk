import importlib
from ai_runtime.base import BaseAIRuntime
from hardware.cpu import get_cpu_info

_std_platform = importlib.import_module("platform")

class QNNRuntime(BaseAIRuntime):
    """Qualcomm Snapdragon Hexagon NPU / QNN Execution Provider.

    STRICT POLICY:
    Never claim Snapdragon or NPU presence on Intel/AMD x86 machines.
    Only activates when Qualcomm ARM64 hardware and verified QNN runtimes are present.
    """

    def __init__(self):
        super().__init__(
            provider_name="Qualcomm QNN (NPU)",
            device_type="NPU",
            description="Qualcomm Hexagon Tensor Processor (HTP) NPU acceleration"
        )
        self._checked = False
        self._available = False
        self._reason = None

    def _verify_hardware(self):
        if not self._checked:
            arch = _std_platform.machine().lower()
            cpu_info = get_cpu_info()
            vendor = cpu_info.get("vendor", "")
            cpu_name = cpu_info.get("name", "").lower()

            # Must be ARM64 / AArch64 architecture and Qualcomm vendor
            is_arm = "arm" in arch or "aarch64" in arch
            is_snapdragon = vendor == "Qualcomm" or "snapdragon" in cpu_name or "x elite" in cpu_name or "sc8" in cpu_name

            if not (is_arm and is_snapdragon):
                self._available = False
                self._reason = "Not supported on this device (requires Qualcomm Snapdragon processor & QNN runtime)"
            else:
                # Check for ONNX Runtime QNN Execution Provider
                try:
                    import onnxruntime as ort
                    providers = ort.get_available_providers()
                    if "QNNExecutionProvider" in providers:
                        self._available = True
                        self._reason = None
                    else:
                        self._available = False
                        self._reason = "Qualcomm hardware detected, but QNN Execution Provider runtime is not installed"
                except Exception:
                    self._available = False
                    self._reason = "ONNX Runtime with QNN Execution Provider not found"

            self._checked = True

    def is_available(self) -> bool:
        self._verify_hardware()
        return self._available

    def get_status(self) -> dict:
        self._verify_hardware()
        return {
            "provider": self.provider_name if self._available else "QNN / NPU (Not Available)",
            "device_type": self.device_type,
            "available": self._available,
            "supported": self._available,
            "npu_available": self._available,
            "qnn_available": self._available,
            "reason": self._reason
        }
