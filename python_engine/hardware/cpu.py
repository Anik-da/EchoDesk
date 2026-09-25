import sys
import subprocess
import importlib
import psutil

_std_platform = importlib.import_module("platform")

try:
    import winreg
except ImportError:
    winreg = None

def get_cpu_info() -> dict:
    """Returns detected CPU name, architecture, core counts, and live utilization."""
    cpu_name = _std_platform.processor() or "Unknown Processor"
    arch = _std_platform.machine()

    # 1. Windows: Query Registry for canonical ProcessorNameString
    if sys.platform == "win32" and winreg:
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\CentralProcessor\0")
            val, _ = winreg.QueryValueEx(key, "ProcessorNameString")
            if val and val.strip():
                cpu_name = val.strip()
            winreg.CloseKey(key)
        except Exception:
            pass

    # 2. macOS: Query sysctl machdep.cpu.brand_string
    elif sys.platform == "darwin":
        try:
            proc = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True, timeout=2)
            if proc.returncode == 0 and proc.stdout.strip():
                cpu_name = proc.stdout.strip()
            elif "arm" in arch.lower():
                # Apple Silicon fallback
                proc = subprocess.run(["sysctl", "-n", "hw.model"], capture_output=True, text=True, timeout=2)
                model = proc.stdout.strip() if proc.returncode == 0 else ""
                cpu_name = f"Apple Silicon ({model})" if model else "Apple Silicon"
        except Exception:
            pass

    # 3. Linux: Read /proc/cpuinfo or lscpu
    elif sys.platform.startswith("linux"):
        try:
            if sys.platform.startswith("linux"):
                with open("/proc/cpuinfo", "r") as f:
                    for line in f:
                        if "model name" in line:
                            cpu_name = line.split(":", 1)[1].strip()
                            break
        except Exception:
            pass

    # Identify vendor
    lower_cpu = cpu_name.lower()
    if "intel" in lower_cpu:
        vendor = "Intel"
    elif "amd" in lower_cpu or "ryzen" in lower_cpu:
        vendor = "AMD"
    elif "apple" in lower_cpu or "m1" in lower_cpu or "m2" in lower_cpu or "m3" in lower_cpu or "m4" in lower_cpu:
        vendor = "Apple"
    elif "qualcomm" in lower_cpu or "snapdragon" in lower_cpu or "sc8" in lower_cpu or "x elite" in lower_cpu:
        vendor = "Qualcomm"
    elif "arm" in lower_cpu:
        vendor = "ARM"
    else:
        vendor = "Generic"

    cores_physical = psutil.cpu_count(logical=False) or 1
    threads_logical = psutil.cpu_count(logical=True) or cores_physical

    # Measure dynamic utilization
    try:
        usage = psutil.cpu_percent(interval=None)
    except Exception:
        usage = 0.0

    return {
        "name": cpu_name,
        "vendor": vendor,
        "architecture": arch,
        "cores": cores_physical,
        "threads": threads_logical,
        "usage_percent": round(usage, 1)
    }
