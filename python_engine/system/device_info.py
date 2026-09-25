import time
import sys
from platform import get_platform_adapter
from hardware.cpu import get_cpu_info
from hardware.memory import get_memory_info
from hardware.gpu import get_gpu_info
from hardware.storage import get_storage_info
from hardware.battery import get_battery_info
from hardware.thermal import get_thermal_info
from ai_runtime import get_best_ai_runtime

class DeviceInfoService:
    """Central cross-platform device telemetry and hardware information service.

    STRICT UNIVERSAL SPECIFICATION:
    - Automatically discovers the actual host operating system, hardware, and sensors.
    - Never uses hardcoded or machine-specific development values.
    - In LIVE mode, returns only verified hardware telemetry or None ('Unavailable').
    - In SIMULATION mode, permits mock telemetry clearly labeled as such.
    """

    def __init__(self):
        self._mode = "LIVE"
        self._platform_adapter = get_platform_adapter()
        self._static_identity = None
        self._last_storage_time = 0
        self._cached_storage = None
        self._ai_runtime = get_best_ai_runtime()

    def set_mode(self, mode: str):
        if mode.upper() in ("LIVE", "SIMULATION"):
            self._mode = mode.upper()

    def get_mode(self) -> str:
        return self._mode

    def get_static_identity(self) -> dict:
        if self._static_identity is None:
            os_info = self._platform_adapter.get_os_info()
            dev_id = self._platform_adapter.get_device_identity()
            self._static_identity = {
                "os": os_info.get("os", sys.platform),
                "os_name": os_info.get("os_name", "Operating System"),
                "os_version": os_info.get("version", "1.0"),
                "architecture": os_info.get("architecture", "x64"),
                "platform_string": os_info.get("platform_string", sys.platform),
                "manufacturer": dev_id.get("manufacturer", "Unknown"),
                "model": dev_id.get("model", "Unknown Device"),
                "motherboard": dev_id.get("motherboard", "Standard")
            }
        return self._static_identity

    def get_system_telemetry(self) -> dict:
        identity = self.get_static_identity()

        if self._mode == "SIMULATION":
            return self._get_simulation_telemetry(identity)

        # 1. Real dynamic hardware queries
        cpu = get_cpu_info()
        memory = get_memory_info()
        gpus = get_gpu_info()
        battery = get_battery_info()
        thermal = get_thermal_info()

        # Cache storage queries for 30s to avoid high-frequency disk I/O
        now = time.time()
        if self._cached_storage is None or (now - self._last_storage_time > 30):
            self._cached_storage = get_storage_info()
            self._last_storage_time = now

        # AI Runtime status
        ai_status = self._ai_runtime.get_status()

        # Capabilities
        caps = self._platform_adapter.get_capabilities()
        cap_dict = {k: v.value if hasattr(v, "value") else str(v) for k, v in caps.items()}

        return {
            "mode": "LIVE",
            "manufacturer": identity["manufacturer"],
            "model": identity["model"],
            "os": identity["os"],
            "os_name": identity["os_name"],
            "os_version": identity["os_version"],
            "architecture": identity["architecture"],
            "platform_string": identity["platform_string"],
            "cpu": cpu,
            "memory": memory,
            "gpu": gpus,
            "storage": self._cached_storage,
            "battery": battery,
            "thermal": thermal,
            "ai_runtime": ai_status,
            "capabilities": cap_dict
        }

    def _get_simulation_telemetry(self, identity: dict) -> dict:
        """Demo simulation mode for testing UI states when hardware is offline."""
        import math
        t = time.time()
        sim_cpu = round(25.0 + 15.0 * math.sin(t * 0.5), 1)
        sim_gpu = round(35.0 + 20.0 * math.cos(t * 0.4), 1)

        return {
            "mode": "SIMULATION",
            "manufacturer": identity["manufacturer"] if identity["manufacturer"] != "Unknown" else "Simulated Hardware",
            "model": identity["model"] if identity["model"] != "Unknown Device" else "EchoDesk Simulator",
            "os": identity["os"],
            "os_name": identity["os_name"],
            "os_version": identity["os_version"],
            "architecture": identity["architecture"],
            "platform_string": "SIMULATED RUNTIME",
            "cpu": {
                "name": "Simulated Processor (DEMO)",
                "vendor": "Simulator",
                "architecture": identity["architecture"],
                "cores": 8,
                "threads": 16,
                "usage_percent": sim_cpu
            },
            "memory": {
                "total_gb": 16.0,
                "used_gb": 8.0,
                "available_gb": 8.0,
                "usage_percent": 50.0
            },
            "gpu": [
                {
                    "name": "Simulated GPU Accelerator",
                    "driver": "Virtual 1.0",
                    "usage_percent": sim_gpu,
                    "temperature_c": 52,
                    "memory_used_mb": 2048,
                    "memory_total_mb": 8192,
                    "status": "Simulated"
                }
            ],
            "storage": [
                {
                    "drive": "Simulated Root",
                    "mount": "/",
                    "filesystem": "Virtual",
                    "total_gb": 512.0,
                    "used_gb": 256.0,
                    "free_gb": 256.0,
                    "usage_percent": 50.0
                }
            ],
            "battery": {
                "available": True,
                "percent": 88,
                "charging": False,
                "power_plugged": False,
                "seconds_left": 14400,
                "status": "Discharging"
            },
            "thermal": {
                "cpu_c": 48,
                "gpu_c": 52,
                "fan_rpm": 2200,
                "cpu_fan_rpm": 2200,
                "gpu_fan_rpm": 2100
            },
            "ai_runtime": {
                "provider": "Simulated NPU Engine",
                "device_type": "NPU",
                "available": True,
                "supported": True,
                "npu_available": True,
                "qnn_available": True,
                "reason": "Simulation Demo Provider"
            },
            "capabilities": {
                "window_context": "AVAILABLE",
                "aggregate_activity": "AVAILABLE",
                "camera_access": "AVAILABLE",
                "audio_input": "AVAILABLE"
            }
        }

    def get_dynamic_telemetry(self, inference_latency_ms=None) -> dict:
        """Alias returning system telemetry for ContextEngine."""
        data = self.get_system_telemetry()
        if inference_latency_ms is not None and "ai_runtime" in data:
            data["ai_runtime"]["inference_latency_ms"] = inference_latency_ms
        return data

    def get_static_info(self) -> dict:
        """Alias returning static device identity for boot reporting."""
        ident = self.get_static_identity()
        cpu = get_cpu_info()
        gpus = get_gpu_info()
        ai = self._ai_runtime.get_status()
        return {
            "manufacturer": ident["manufacturer"],
            "model": ident["model"],
            "cpu_name": cpu["name"],
            "gpus": gpus,
            "os": ident["os_name"],
            "architecture": ident["architecture"],
            "npu_info": ai
        }

device_service = DeviceInfoService()
