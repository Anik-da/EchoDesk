import time
from platform import get_platform_adapter
from platform.base import CapabilityState

class ActivitySensor:
    """Aggregate activity sensor: measures idle time and interaction velocity.

    STRICT PRIVACY POLICY:
    - Never logs or captures keystrokes.
    - Never reads typed words or characters.
    - Only tracks aggregate IDLE vs ACTIVE state and cursor distance.
    """

    def __init__(self):
        self.enabled = True
        self.last_pos = (0, 0)
        self.last_time = time.time()

    def read(self) -> dict:
        if not self.enabled:
            return {
                "sensor": "activity",
                "enabled": False,
                "available": True,
                "state": "off",
                "activity_level": 0,
                "semantic_outputs": ["IDLE"],
                "description": "User activity sensing disabled"
            }

        adapter = get_platform_adapter()
        idle_ms = adapter.get_idle_time_ms()
        cur_pos = adapter.get_cursor_pos()
        now = time.time()

        distance = abs(cur_pos[0] - self.last_pos[0]) + abs(cur_pos[1] - self.last_pos[1])
        self.last_pos = cur_pos
        self.last_time = now

        if idle_ms > 120000:
            state = "off"
            level = 0
            semantics = ["IDLE"]
            desc = "System idle (no input > 2 min)"
        elif idle_ms > 30000:
            state = "low"
            level = 15
            semantics = ["IDLE"]
            desc = "System idle (low activity)"
        else:
            state = "active"
            if distance > 10:
                level = min(100, int(40 + distance * 0.5))
                semantics = ["ACTIVE", "MOUSE_ACTIVITY"]
                desc = "Active navigation / mouse movement"
            else:
                level = 80
                semantics = ["ACTIVE", "INPUT_ACTIVITY"]
                desc = "Active interaction (aggregate activity meter — zero keystrokes stored)"

        return {
            "sensor": "activity",
            "enabled": True,
            "available": True,
            "capability_state": CapabilityState.AVAILABLE.value,
            "state": state,
            "activity_level": level,
            "semantic_outputs": semantics,
            "description": desc
        }
