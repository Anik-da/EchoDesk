import sys
import subprocess
import json

def get_nvidia_telemetry() -> list:
    """Queries nvidia-smi for active NVIDIA GPU utilization, temperature, and VRAM."""
    try:
        cmd = [
            "nvidia-smi",
            "--query-gpu=name,utilization.gpu,temperature.gpu,memory.used,memory.total,driver_version",
            "--format=csv,noheader,nounits"
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=2)
        if proc.returncode == 0 and proc.stdout.strip():
            results = []
            for line in proc.stdout.strip().splitlines():
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 6:
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
                    driver = parts[5]

                    results.append({
                        "name": name,
                        "driver": driver,
                        "usage_percent": util,
                        "temperature_c": temp,
                        "memory_used_mb": mem_used,
                        "memory_total_mb": mem_total,
                        "status": "Available"
                    })
            return results
    except Exception:
        pass
    return []

def get_gpu_info() -> list:
    """Cross-platform GPU enumeration with dynamic telemetry where supported."""
    gpus = []

    # 1. First check NVIDIA GPU via nvidia-smi (works on both Windows & Linux)
    nvidia_gpus = get_nvidia_telemetry()
    if nvidia_gpus:
        gpus.extend(nvidia_gpus)

    # 2. Platform-specific enumeration for integrated or secondary GPUs
    if sys.platform == "win32":
        try:
            cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_VideoController | Select-Object -Property Name, DriverVersion, AdapterRAM | ConvertTo-Json"]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                if isinstance(data, dict):
                    data = [data]
                for item in data:
                    name = item.get("Name", "").strip()
                    if not name or name.lower().startswith("sharing monitor"):
                        continue
                    # Skip if already enumerated by nvidia-smi
                    if any(g["name"].lower() in name.lower() or name.lower() in g["name"].lower() for g in gpus):
                        continue
                    adapter_ram = item.get("AdapterRAM")
                    mem_mb = round(adapter_ram / (1024 ** 2)) if adapter_ram and adapter_ram > 0 else None
                    gpus.append({
                        "name": name,
                        "driver": item.get("DriverVersion"),
                        "usage_percent": None,
                        "temperature_c": None,
                        "memory_used_mb": None,
                        "memory_total_mb": mem_mb,
                        "status": "Detected"
                    })
        except Exception:
            pass

    elif sys.platform == "darwin":
        try:
            proc = subprocess.run(["system_profiler", "SPDisplaysDataType", "-json"], capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                disp_items = data.get("SPDisplaysDataType", [])
                for item in disp_items:
                    name = item.get("sppci_model") or item.get("_name", "Apple GPU")
                    vram_str = item.get("spdisplays_vram", "")
                    gpus.append({
                        "name": name,
                        "driver": "Apple Metal Framework",
                        "usage_percent": None,
                        "temperature_c": None,
                        "memory_used_mb": None,
                        "memory_total_mb": None,
                        "status": "Detected"
                    })
        except Exception:
            pass

    elif sys.platform.startswith("linux"):
        # Query lspci for VGA/3D controllers
        try:
            proc = subprocess.run(["lspci"], capture_output=True, text=True, timeout=2)
            if proc.returncode == 0:
                for line in proc.stdout.splitlines():
                    if any(term in line.lower() for term in ["vga compatible controller", "3d controller", "display controller"]):
                        parts = line.split(":", 2)
                        desc = parts[2].strip() if len(parts) > 2 else line
                        if not any(g["name"].lower() in desc.lower() for g in gpus):
                            gpus.append({
                                "name": desc,
                                "driver": "Linux DRM/Mesa",
                                "usage_percent": None,
                                "temperature_c": None,
                                "memory_used_mb": None,
                                "memory_total_mb": None,
                                "status": "Detected"
                            })
        except Exception:
            pass

    if not gpus:
        gpus.append({
            "name": "Standard Display Controller",
            "driver": None,
            "usage_percent": None,
            "temperature_c": None,
            "memory_used_mb": None,
            "memory_total_mb": None,
            "status": "Detected"
        })

    return gpus
