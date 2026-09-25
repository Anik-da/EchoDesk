import os
import sys
import platform
import subprocess
import json
import psutil

try:
    import winreg
except ImportError:
    winreg = None

class DeviceInfoService:
    def __init__(self):
        self._static_info = None
        self._last_cpu_time = 0
        self._last_gpu_query = 0
        self._cached_gpu_telemetry = None
        self._cached_storage = None
        self._last_storage_query = 0
        # Initialize psutil cpu percent measurement baseline
        psutil.cpu_percent(interval=None)

    def _query_wmi_computer_system(self):
        manufacturer = "Unknown"
        model = "Unknown"
        try:
            cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_ComputerSystem | Select-Object -Property Manufacturer, Model | ConvertTo-Json"]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                if isinstance(data, list) and len(data) > 0:
                    data = data[0]
                manufacturer = data.get("Manufacturer", "Unknown").strip()
                model = data.get("Model", "Unknown").strip()
        except Exception:
            pass

        # Fallback to Win32_BaseBoard if model is empty or Generic
        if model in ("Unknown", "System Product Name", ""):
            try:
                cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_BaseBoard | Select-Object -Property Manufacturer, Product | ConvertTo-Json"]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
                if proc.returncode == 0 and proc.stdout.strip():
                    data = json.loads(proc.stdout)
                    if isinstance(data, list) and len(data) > 0:
                        data = data[0]
                    if manufacturer == "Unknown":
                        manufacturer = data.get("Manufacturer", "Unknown").strip()
                    model = data.get("Product", "Unknown").strip()
            except Exception:
                pass

        return manufacturer, model

    def _query_cpu_name(self):
        cpu_name = platform.processor() or "Unknown CPU"
        if winreg:
            try:
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
                val, _ = winreg.QueryValueEx(key, "ProcessorNameString")
                if val:
                    cpu_name = val.strip()
                winreg.CloseKey(key)
            except Exception:
                pass
        return cpu_name

    def _query_gpus(self):
        gpus = []
        try:
            cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_VideoController | Select-Object -Property Name, DriverVersion, AdapterRAM | ConvertTo-Json"]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                if isinstance(data, dict):
                    data = [data]
                for item in data:
                    name = item.get("Name", "").strip()
                    # Filter out remote desktop / virtual mirror display drivers if hardware GPU exists
                    if name and not name.lower().startswith("sharing monitor"):
                        adapter_ram = item.get("AdapterRAM")
                        mem_mb = round(adapter_ram / (1024**2)) if adapter_ram and adapter_ram > 0 else None
                        gpus.append({
                            "name": name,
                            "driver": item.get("DriverVersion"),
                            "memory_total_mb": mem_mb,
                            "status": "Detected"
                        })
        except Exception:
            pass

        if not gpus:
            gpus.append({
                "name": "Standard Display Adapter",
                "driver": None,
                "memory_total_mb": None,
                "status": "Detected"
            })
        return gpus

    def _query_nvidia_telemetry(self):
        # Queries nvidia-smi for active NVIDIA GPU utilization, temp, and VRAM
        try:
            cmd = [
                "nvidia-smi",
                "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total",
                "--format=csv,noheader,nounits"
            ]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
            if proc.returncode == 0 and proc.stdout.strip():
                lines = proc.stdout.strip().splitlines()
                results = []
                for line in lines:
                    parts = [p.strip() for p in line.split(",")]
                    if len(parts) >= 5:
                        name = parts[0]
                        try:
                            util = float(parts[1])
                        except ValueError:
                            util = None
                        try:
                            temp = int(parts[2])
                        except ValueError:
                            temp = None
                        try:
                            mem_used = int(parts[3])
                        except ValueError:
                            mem_used = None
                        try:
                            mem_total = int(parts[4])
                        except ValueError:
                            mem_total = None
                        results.append({
                            "name": name,
                            "usage_percent": util,
                            "temperature_c": temp,
                            "memory_used_mb": mem_used,
                            "memory_total_mb": mem_total
                        })
                return results
        except Exception:
            pass
        return None

    def _query_npu_capabilities(self):
        # Detect Qualcomm / Snapdragon / NPU architecture and Execution Providers
        arch = platform.machine().lower()
        processor_str = (self._query_cpu_name() + " " + platform.processor()).lower()
        is_qualcomm = "qualcomm" in processor_str or "snapdragon" in processor_str or "sc8" in processor_str or "x elite" in processor_str
        
        qnn_available = False
        npu_available = False
        active_provider = "CPU"

        try:
            import onnxruntime as ort
            providers = ort.get_available_providers()
            if "QNNExecutionProvider" in providers and is_qualcomm:
                qnn_available = True
                npu_available = True
                active_provider = "NPU"
            elif "CUDAExecutionProvider" in providers:
                active_provider = "CUDA"
            elif "DmlExecutionProvider" in providers:
                active_provider = "DirectML"
            else:
                active_provider = "CPU"
        except Exception:
            # Fallback based on architecture
            if is_qualcomm and "arm" in arch:
                active_provider = "NPU (Driver Pending)"
            else:
                active_provider = "CPU"

        return {
            "npu_available": npu_available,
            "qnn_available": qnn_available,
            "provider": active_provider,
            "architecture": platform.machine()
        }

    def get_static_info(self):
        if self._static_info is not None:
            return self._static_info

        manufacturer, model = self._query_wmi_computer_system()
        cpu_name = self._query_cpu_name()
        cores_phys = psutil.cpu_count(logical=False) or 1
        cores_log = psutil.cpu_count(logical=True) or 1
        gpus = self._query_gpus()
        npu_info = self._query_npu_capabilities()

        # Format OS string
        os_release = platform.system()
        if os_release == "Windows":
            os_ver = platform.version()
            os_display = f"Windows 11 ({os_ver})" if "10.0." in os_ver else f"Windows ({os_ver})"
        else:
            os_display = platform.platform()

        self._static_info = {
            "manufacturer": manufacturer,
            "model": model,
            "os": os_display,
            "architecture": platform.machine(),
            "cpu_name": cpu_name,
            "cpu_cores": cores_phys,
            "cpu_threads": cores_log,
            "gpus": gpus,
            "npu_info": npu_info
        }
        return self._static_info

    def get_dynamic_telemetry(self, inference_latency_ms: float = None):
        static = self.get_static_info()

        # 1. Real CPU load
        cpu_usage = psutil.cpu_percent(interval=None)

        # 2. Real RAM
        mem = psutil.virtual_memory()
        total_ram_gb = round(mem.total / (1024**3), 1)
        used_ram_gb = round(mem.used / (1024**3), 1)
        avail_ram_gb = round(mem.available / (1024**3), 1)
        ram_percent = round(mem.percent, 1)

        # 3. Real Storage (polled periodically or cached)
        now = psutil.time.time()
        if self._cached_storage is None or (now - self._last_storage_query) > 15:
            disks = []
            for part in psutil.disk_partitions(all=False):
                if "fixed" in part.opts or part.fstype:
                    try:
                        u = psutil.disk_usage(part.mountpoint)
                        disks.append({
                            "device": part.device,
                            "mountpoint": part.mountpoint,
                            "total_gb": round(u.total / (1024**3), 1),
                            "used_gb": round(u.used / (1024**3), 1),
                            "free_gb": round(u.free / (1024**3), 1),
                            "usage_percent": round(u.percent, 1)
                        })
                    except (PermissionError, OSError):
                        pass
            self._cached_storage = disks
            self._last_storage_query = now
        storage_list = self._cached_storage or []

        # 4. Real Battery & AC Power
        batt = psutil.sensors_battery()
        if batt is not None:
            battery_info = {
                "available": True,
                "percent": round(batt.percent, 1),
                "charging": batt.power_plugged,
                "power_plugged": batt.power_plugged,
                "power_state": "AC Connected" if batt.power_plugged else "Battery Discharging"
            }
        else:
            battery_info = {
                "available": False,
                "percent": None,
                "charging": None,
                "power_plugged": True,
                "power_state": "AC Connected (Desktop/No Battery)"
            }

        # 5. Real GPU Telemetry (NVIDIA NVML / nvidia-smi if present, else fallback)
        nvidia_stats = self._query_nvidia_telemetry()
        gpu_output = []

        primary_gpu_temp = None
        primary_gpu_usage = None

        for base_gpu in static["gpus"]:
            gpu_name = base_gpu["name"]
            matched_nv = None
            if nvidia_stats:
                for nv in nvidia_stats:
                    if nv["name"].lower() in gpu_name.lower() or gpu_name.lower() in nv["name"].lower():
                        matched_nv = nv
                        break

            if matched_nv:
                gpu_output.append({
                    "name": gpu_name,
                    "usage_percent": matched_nv["usage_percent"],
                    "temperature_c": matched_nv["temperature_c"],
                    "memory_used_mb": matched_nv["memory_used_mb"],
                    "memory_total_mb": matched_nv["memory_total_mb"],
                    "status": "Active"
                })
                if primary_gpu_temp is None:
                    primary_gpu_temp = matched_nv["temperature_c"]
                if primary_gpu_usage is None:
                    primary_gpu_usage = matched_nv["usage_percent"]
            else:
                gpu_output.append({
                    "name": gpu_name,
                    "usage_percent": None,
                    "temperature_c": None,
                    "memory_used_mb": None,
                    "memory_total_mb": base_gpu.get("memory_total_mb"),
                    "status": "Detected"
                })

        # 6. Thermal & Fan
        # Windows does not expose CPU temp or Fan RPM via standard unprivileged APIs
        # Report None so the UI renders "Unavailable" honestly.
        thermal = {
            "cpu_c": None,
            "gpu_c": primary_gpu_temp,
            "fan_rpm": None,
            "cpu_fan_rpm": None,
            "gpu_fan_rpm": None
        }

        # 7. AI Runtime
        npu = static["npu_info"]
        ai_runtime = {
            "provider": npu["provider"],
            "npu_available": npu["npu_available"],
            "qnn_available": npu["qnn_available"],
            "inference_latency_ms": inference_latency_ms
        }

        return {
            "mode": "LIVE",
            "manufacturer": static["manufacturer"],
            "model": static["model"],
            "os": static["os"],
            "architecture": static["architecture"],
            "cpu": {
                "name": static["cpu_name"],
                "cores": static["cpu_cores"],
                "threads": static["cpu_threads"],
                "usage_percent": cpu_usage
            },
            "memory": {
                "total_gb": total_ram_gb,
                "used_gb": used_ram_gb,
                "available_gb": avail_ram_gb,
                "usage_percent": ram_percent
            },
            "gpu": gpu_output,
            "storage": storage_list,
            "battery": battery_info,
            "thermal": thermal,
            "ai_runtime": ai_runtime
        }

# Global singleton
device_service = DeviceInfoService()

if __name__ == "__main__":
    print("Testing DeviceInfoService live query...")
    data = device_service.get_dynamic_telemetry(inference_latency_ms=0.35)
    print(json.dumps(data, indent=2))
