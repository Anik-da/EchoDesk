import sys
import ctypes
import time
from adapters.base_adapter import BaseSensorAdapter

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

def get_idle_time_ms():
    """Returns system idle time in milliseconds using the active platform adapter."""
    try:
        from platform import get_platform_adapter
        adapter = get_platform_adapter()
        return adapter.get_idle_time_ms()
    except Exception:
        return 0

class ActivityAdapter(BaseSensorAdapter):
    def __init__(self):
        super().__init__(sensor_id="activity", sensor_type="activity", label="Keyboard & Mouse")
        self.last_pos = (0, 0)
        self.last_time = time.time()

    def is_available(self) -> bool:
        return True

    def get_cursor_pos(self):
        try:
            from platform import get_platform_adapter
            adapter = get_platform_adapter()
            return adapter.get_cursor_pos()
        except Exception:
            return (0, 0)

    def read(self) -> dict:
        if not self.enabled:
            return {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": False,
                "available": True,
                "state": "off",
                "activityLevel": 0,
                "semantic_outputs": ["IDLE"],
                "description": "User activity sensing disabled"
            }

        idle_ms = get_idle_time_ms()
        cur_pos = self.get_cursor_pos()
        now = time.time()
        dt = max(now - self.last_time, 0.1)

        distance = abs(cur_pos[0] - self.last_pos[0]) + abs(cur_pos[1] - self.last_pos[1])
        self.last_pos = cur_pos
        self.last_time = now

        # Determine input state based on aggregate idle time and cursor velocity
        if idle_ms > 120000:  # 2 minutes idle
            state = "off"
            activity_level = 0
            semantics = ["IDLE"]
            desc = "System idle (no input > 2 mins)"
        elif idle_ms > 30000:  # 30 seconds idle
            state = "low"
            activity_level = 15
            semantics = ["IDLE"]
            desc = "System idle (low activity)"
        else:
            state = "active"
            if distance > 10:
                activity_level = min(100, int(40 + distance * 0.5))
                semantics = ["ACTIVE", "MOUSE_ACTIVITY"]
                desc = "Active mouse movement & navigation"
            else:
                activity_level = 80
                semantics = ["ACTIVE", "KEYBOARD_ACTIVITY"]
                desc = "Active keyboard input (density meter only — zero keystrokes stored)"

        return {
            "id": self.sensor_id,
            "label": self.label,
            "enabled": True,
            "available": True,
            "state": state,
            "activityLevel": activity_level,
            "semantic_outputs": semantics,
            "description": desc
        }
