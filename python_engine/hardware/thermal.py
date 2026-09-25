import sys
import psutil
from hardware.gpu import get_nvidia_telemetry

def get_thermal_info() -> dict:
    """Returns verified temperature and fan telemetry.

    CRITICAL RULE:
    Never invent or fabricate temperature or fan RPM.
    If the host OS does not expose sensor readings without kernel drivers,
    return None (rendered as 'Unavailable' in the UI).
    """
    cpu_c = None
    gpu_c = None
    fan_rpm = None

    # 1. Check NVIDIA GPU temperature (available on Windows & Linux with NVIDIA driver)
    try:
        nvidia_gpus = get_nvidia_telemetry()
        if nvidia_gpus and nvidia_gpus[0].get("temperature_c") is not None:
            gpu_c = nvidia_gpus[0]["temperature_c"]
    except Exception:
        pass

    # 2. Check psutil hardware sensors (available on Linux and some macOS/BSD architectures)
    try:
        if hasattr(psutil, "sensors_temperatures"):
            temps = psutil.sensors_temperatures()
            if temps:
                for name, entries in temps.items():
                    lower_name = name.lower()
                    if any(k in lower_name for k in ["coretemp", "cpu", "k10temp", "zenpower"]):
                        for e in entries:
                            if hasattr(e, "current") and e.current:
                                cpu_c = int(e.current)
                                break
                    elif "gpu" in lower_name or "amdgpu" in lower_name:
                        for e in entries:
                            if hasattr(e, "current") and e.current and gpu_c is None:
                                gpu_c = int(e.current)
                                break
    except Exception:
        pass

    # 3. Check psutil fan sensors
    try:
        if hasattr(psutil, "sensors_fans"):
            fans = psutil.sensors_fans()
            if fans:
                for name, entries in fans.items():
                    for e in entries:
                        if hasattr(e, "current") and e.current and e.current > 0:
                            fan_rpm = int(e.current)
                            break
    except Exception:
        pass

    return {
        "cpu_c": cpu_c,
        "gpu_c": gpu_c,
        "fan_rpm": fan_rpm,
        "cpu_fan_rpm": fan_rpm,
        "gpu_fan_rpm": None
    }
