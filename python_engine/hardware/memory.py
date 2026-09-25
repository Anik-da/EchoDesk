import psutil

def get_memory_info() -> dict:
    """Returns total, used, available memory and percentage."""
    try:
        mem = psutil.virtual_memory()
        total_gb = round(mem.total / (1024 ** 3), 1)
        used_gb = round(mem.used / (1024 ** 3), 1)
        available_gb = round(mem.available / (1024 ** 3), 1)
        percent = round(mem.percent, 1)
    except Exception:
        total_gb = 0.0
        used_gb = 0.0
        available_gb = 0.0
        percent = 0.0

    return {
        "total_gb": total_gb,
        "used_gb": used_gb,
        "available_gb": available_gb,
        "usage_percent": percent
    }
