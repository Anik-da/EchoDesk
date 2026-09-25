import time
import os
import psutil
from engine.ai_model_abstraction import get_hardware_capabilities

class RuntimeBenchmarker:
    def __init__(self):
        self.process = psutil.Process(os.getpid())

    def benchmark_model(self, model_obj) -> dict:
        start_load = time.perf_counter()
        loaded = model_obj.load()
        load_time_ms = round((time.perf_counter() - start_load) * 1000, 2)

        start_infer = time.perf_counter()
        result = model_obj.infer({})
        infer_latency_ms = round((time.perf_counter() - start_infer) * 1000, 2)

        # Real process RSS memory measurement
        try:
            mem_mb = round(self.process.memory_info().rss / 1024 / 1024, 1)
        except Exception:
            mem_mb = None

        # Real process CPU percent measurement
        try:
            cpu_pct = round(self.process.cpu_percent(interval=None), 1)
        except Exception:
            cpu_pct = None

        capabilities = get_hardware_capabilities()

        return {
            "modelName": model_obj.model_name,
            "loaded": loaded,
            "loadTimeMs": load_time_ms,
            "inferenceLatencyMs": infer_latency_ms,
            "cpuOverheadPct": cpu_pct,  # returns null if unmeasurable
            "memoryUsedMb": mem_mb,     # returns null if unmeasurable
            "selectedProvider": model_obj.provider(),
            "hardwareCapabilities": capabilities
        }
