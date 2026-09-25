from abc import ABC, abstractmethod
import time
import platform

# Check available runtime providers
TRY_ONNX = False
ONNX_PROVIDERS = []
try:
    import onnxruntime as ort
    TRY_ONNX = True
    ONNX_PROVIDERS = ort.get_available_providers()
except Exception:
    pass

TRY_TORCH = False
CUDA_AVAILABLE = False
try:
    import torch
    TRY_TORCH = True
    CUDA_AVAILABLE = torch.cuda.is_available()
except Exception:
    pass

class BaseModel(ABC):
    """Abstract Base Class for all EchoDesk AI models."""
    def __init__(self, model_name: str, model_type: str):
        self.model_name = model_name
        self.model_type = model_type
        self.is_loaded = False
        self.last_latency_ms = None
        self.memory_used_mb = None

    @abstractmethod
    def load(self) -> bool:
        pass

    @abstractmethod
    def infer(self, input_data: dict) -> dict:
        pass

    def latency(self) -> float:
        return self.last_latency_ms if self.last_latency_ms is not None else 0.0

    def provider(self) -> str:
        if CUDA_AVAILABLE:
            return "CUDA"
        elif "DirectMLExecutionProvider" in ONNX_PROVIDERS:
            return "DirectML"
        else:
            return "CPU"

    def memory(self) -> float:
        return self.memory_used_mb if self.memory_used_mb is not None else 0.0

class VisionModel(BaseModel):
    def __init__(self):
        super().__init__("TinyVision-HaarV2", "VisionModel")

    def load(self) -> bool:
        self.is_loaded = True
        self.memory_used_mb = 24.5
        return True

    def infer(self, input_data: dict) -> dict:
        start = time.perf_counter()
        time.sleep(0.002)
        elapsed = (time.perf_counter() - start) * 1000
        self.last_latency_ms = round(elapsed, 2)
        return {"presence": True, "latency_ms": self.last_latency_ms}

class AudioModel(BaseModel):
    def __init__(self):
        super().__init__("EnergyVAD-v1", "AudioModel")

    def load(self) -> bool:
        self.is_loaded = True
        self.memory_used_mb = 12.0
        return True

    def infer(self, input_data: dict) -> dict:
        start = time.perf_counter()
        time.sleep(0.001)
        elapsed = (time.perf_counter() - start) * 1000
        self.last_latency_ms = round(elapsed, 2)
        return {"vad": True, "latency_ms": self.last_latency_ms}

class ContextModel(BaseModel):
    def __init__(self):
        super().__init__("TinyLlama-1.1B-Context", "ContextModel")

    def load(self) -> bool:
        self.is_loaded = True
        self.memory_used_mb = 148.0
        return True

    def infer(self, input_data: dict) -> dict:
        start = time.perf_counter()
        time.sleep(0.008)
        elapsed = (time.perf_counter() - start) * 1000
        self.last_latency_ms = round(elapsed, 2)
        return {"classified": True, "latency_ms": self.last_latency_ms}

def get_hardware_capabilities() -> dict:
    """Hardware capability detection for host system."""
    arch = platform.machine()

    has_qnn = "QNNExecutionProvider" in ONNX_PROVIDERS
    has_npu = has_qnn

    if CUDA_AVAILABLE:
        provider = "CUDA"
    elif "DirectMLExecutionProvider" in ONNX_PROVIDERS:
        provider = "DirectML"
    else:
        provider = "CPU"

    return {
        "hardware": "Intel CPU / NVIDIA GPU (GIGABYTE G6)",
        "architecture": arch,
        "provider": provider,
        "npuAvailable": has_npu,
        "qnnAvailable": has_qnn,
        "onnxProviders": ONNX_PROVIDERS,
        "cudaAvailable": CUDA_AVAILABLE,
        "mode": "development"
    }
