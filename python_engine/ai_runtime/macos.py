from ai_runtime.base import BaseAIRuntime
from ai_runtime.cpu import CPURuntime
from ai_runtime.coreml import CoreMLRuntime

def select_macos_ai_runtime() -> BaseAIRuntime:
    """Selects best supported AI runtime on macOS: CoreML / Apple Neural Engine -> CPU (Fallback)."""
    coreml = CoreMLRuntime()
    if coreml.is_available():
        return coreml

    return CPURuntime()
