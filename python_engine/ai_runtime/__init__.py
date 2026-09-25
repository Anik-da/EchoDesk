import sys
from ai_runtime.base import BaseAIRuntime
from ai_runtime.cpu import CPURuntime
from ai_runtime.cuda import CUDARuntime
from ai_runtime.qnn import QNNRuntime
from ai_runtime.coreml import CoreMLRuntime
from ai_runtime.windows import select_windows_ai_runtime
from ai_runtime.macos import select_macos_ai_runtime
from ai_runtime.linux import select_linux_ai_runtime

_current_runtime = None

def get_best_ai_runtime() -> BaseAIRuntime:
    """Detects and returns the best working AI accelerator runtime for the host OS and hardware."""
    global _current_runtime
    if _current_runtime is None:
        if sys.platform == "win32":
            _current_runtime = select_windows_ai_runtime()
        elif sys.platform == "darwin":
            _current_runtime = select_macos_ai_runtime()
        else:
            _current_runtime = select_linux_ai_runtime()
    return _current_runtime

__all__ = [
    "BaseAIRuntime",
    "CPURuntime",
    "CUDARuntime",
    "QNNRuntime",
    "CoreMLRuntime",
    "get_best_ai_runtime"
]
