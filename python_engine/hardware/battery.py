import psutil

def get_battery_info() -> dict:
    """Returns battery telemetry if present, or marks unavailable on desktop/unsupported systems."""
    try:
        batt = psutil.sensors_battery()
        if batt is not None:
            return {
                "available": True,
                "percent": int(batt.percent),
                "charging": bool(batt.power_plugged),
                "power_plugged": bool(batt.power_plugged),
                "seconds_left": batt.secsleft if batt.secsleft not in (-1, -2) else None,
                "status": "Charging" if batt.power_plugged else "Discharging",
                "power_state": "AC Connected" if batt.power_plugged else "Battery"
            }
    except Exception:
        pass

    return {
        "available": False,
        "percent": None,
        "charging": None,
        "power_plugged": None,
        "seconds_left": None,
        "status": "Not available on this device",
        "power_state": "Not available"
    }
