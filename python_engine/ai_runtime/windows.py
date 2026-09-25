from ai_runtime.base import BaseAIRuntime
from ai_runtime.cpu import CPURuntime
from ai_runtime.cuda import CUDARuntime
from ai_runtime.qnn import QNNRuntime

def select_windows_ai_runtime() -> BaseAIRuntime:
    """Selects best supported AI runtime on Windows: QNN (Snapdragon) -> CUDA (NVIDIA) -> CPU (Universal)."""
    # 1. Check Qualcomm Snapdragon QNN
    qnn = QNNRuntime()
    if qnn.is_available():
        return qnn

    # 2. Check NVIDIA CUDA
    cuda = CUDARuntime()
    if cuda.is_available():
        return cuda

    # 3. Fallback to CPU
    return CPURuntime()
