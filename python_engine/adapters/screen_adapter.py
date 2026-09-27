import sys
import time
from adapters.base_adapter import BaseSensorAdapter

def get_active_foreground_window():
    """Returns (app_name, window_title, process_name) using platform adapter."""
    try:
        from platform import get_platform_adapter
        adapter = get_platform_adapter()
        res = adapter.get_window_context()
        if len(res) == 3:
            return res
        return res[0], res[1], "unknown.exe"
    except Exception:
        return "Desktop", "System Application Window", "explorer.exe"

class ScreenAdapter(BaseSensorAdapter):
    """Real active application and window context sensor adapter for Windows."""

    def __init__(self):
        super().__init__(sensor_id="screen", sensor_type="screen", label="Screen Context")

    def is_available(self) -> bool:
        return True

    def classify_app_category(self, app_name: str, window_title: str, process_name: str) -> str:
        proc_lower = process_name.lower()
        title_lower = window_title.lower()
        app_lower = app_name.lower()

        # Check for Video Call / Meeting in browser or app
        if any(k in title_lower for k in ["google meet", "zoom meeting", "teams call", "microsoft teams call"]):
            return "MEETING"

        if proc_lower in ("code.exe", "devenv.exe", "idea64.exe", "pycharm64.exe", "clion64.exe", "webstorm64.exe", "rider64.exe") or "visual studio" in app_lower or "vscode" in app_lower:
            return "CODING"
        elif proc_lower in ("windowsterminal.exe", "cmd.exe", "powershell.exe", "pwsh.exe") or "terminal" in app_lower:
            return "DEVELOPMENT"
        elif proc_lower in ("teams.exe", "ms-teams.exe", "zoom.exe", "skype.exe") or "teams" in app_lower or "zoom" in app_lower:
            return "MEETING"
        elif proc_lower in ("chrome.exe", "msedge.exe", "firefox.exe", "brave.exe", "opera.exe") or "chrome" in app_lower or "edge" in app_lower:
            return "RESEARCH"
        elif proc_lower == "explorer.exe" or "file explorer" in app_lower:
            return "FILE_MANAGEMENT"
        elif proc_lower in ("1password.exe", "bitwarden.exe", "keepass.exe"):
            return "PROTECTED"
        else:
            return "GENERAL"

    def read(self) -> dict:
        if not self.enabled:
            return {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": False,
                "available": True,
                "state": "off",
                "activityLevel": 0,
                "activeApp": "None",
                "process": "none.exe",
                "windowTitle": "Sensing Disabled",
                "category": "UNKNOWN",
                "semantic_outputs": ["UNKNOWN_ACTIVITY"],
                "description": "Screen application sensing disabled",
                "timestamp": time.time()
            }

        app_name, window_title, process_name = get_active_foreground_window()
        category = self.classify_app_category(app_name, window_title, process_name)

        semantic_map = {
            "CODING": "CODING_ACTIVITY",
            "DEVELOPMENT": "CODING_ACTIVITY",
            "RESEARCH": "RESEARCH_ACTIVITY",
            "MEETING": "MEETING_ACTIVE",
            "FILE_MANAGEMENT": "FILE_MANAGEMENT_ACTIVITY",
            "GENERAL": "GENERAL_ACTIVITY"
        }
        semantic_output = semantic_map.get(category, "GENERAL_ACTIVITY")

        return {
            "id": self.sensor_id,
            "label": self.label,
            "enabled": True,
            "available": True,
            "state": "active",
            "activityLevel": 85 if category in ["CODING", "DEVELOPMENT", "RESEARCH", "MEETING"] else 40,
            "activeApp": app_name,
            "process": process_name,
            "windowTitle": window_title,
            "category": category,
            "semantic_outputs": [semantic_output],
            "description": f"Active: {app_name} ({process_name}) — {window_title[:35]}",
            "timestamp": time.time()
        }
