from ai_runtime.base import BaseAIRuntime
from ai_runtime.cpu import CPURuntime
from ai_runtime.cuda import CUDARuntime

def select_linux_ai_runtime() -> BaseAIRuntime:
    """Selects best supported AI runtime on Linux: CUDA (NVIDIA) -> CPU (Universal Fallback)."""
    cuda = CUDARuntime()
    if cuda.is_available():
        return cuda

    return CPURuntime()
