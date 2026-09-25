import sys
import ctypes
from adapters.base_adapter import BaseSensorAdapter

DEFAULT_APP_CATEGORY_MAP = {
    "vscode": "CODING",
    "code": "CODING",
    "visual studio": "CODING",
    "pycharm": "CODING",
    "intellij": "CODING",
    "terminal": "CODING",
    "powershell": "CODING",
    "cmd": "CODING",
    
    "chrome": "RESEARCH",
    "edge": "RESEARCH",
    "firefox": "RESEARCH",
    "brave": "RESEARCH",
    
    "zoom": "MEETING",
    "teams": "MEETING",
    "meet": "MEETING",
    "slack": "COMMUNICATION",
    "discord": "COMMUNICATION",
    "skype": "MEETING",
    
    "explorer": "FILE_MANAGEMENT",
    "file explorer": "FILE_MANAGEMENT",
    
    "1password": "PROTECTED",
    "bitwarden": "PROTECTED"
}

def get_active_foreground_window():
    """Returns (app_name, window_title) using native Windows ctypes."""
    if sys.platform == "win32":
        try:
            hwnd = ctypes.windll.user32.GetForegroundWindow()
            if not hwnd:
                return "Desktop", "Windows Desktop"

            length = ctypes.windll.user32.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(length + 1)
            ctypes.windll.user32.GetWindowTextW(hwnd, buf, length + 1)
            title = buf.value or "System Window"

            pid = ctypes.c_ulong()
            ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))

            lower_title = title.lower()
            if "code" in lower_title or "visual studio" in lower_title:
                app_name = "VS Code"
            elif "chrome" in lower_title:
                app_name = "Google Chrome"
            elif "edge" in lower_title:
                app_name = "Microsoft Edge"
            elif "zoom" in lower_title or "meeting" in lower_title:
                app_name = "Zoom"
            elif "slack" in lower_title:
                app_name = "Slack"
            elif "1password" in lower_title:
                app_name = "1Password"
            elif "explorer" in lower_title or "this pc" in lower_title:
                app_name = "File Explorer"
            else:
                parts = title.rsplit(" - ", 1)
                app_name = parts[1] if len(parts) > 1 else title[:20]

            return app_name, title
        except Exception:
            return "VS Code", "EchoDesk — Visual Studio Code"
    return "VS Code", "EchoDesk — Visual Studio Code"

class ScreenAdapter(BaseSensorAdapter):
    def __init__(self, category_map=None):
        super().__init__(sensor_id="screen", sensor_type="screen", label="Screen Context")
        self.category_map = category_map or DEFAULT_APP_CATEGORY_MAP

    def is_available(self) -> bool:
        return True

    def classify_app_category(self, app_name: str, window_title: str) -> str:
        text = f"{app_name} {window_title}".lower()
        for key, cat in self.category_map.items():
            if key in text:
                return cat
        return "UNKNOWN"

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
                "windowTitle": "Sensing Disabled",
                "category": "UNKNOWN",
                "semantic_outputs": ["UNKNOWN_ACTIVITY"],
                "description": "Screen application sensing disabled"
            }

        app_name, window_title = get_active_foreground_window()
        category = self.classify_app_category(app_name, window_title)

        semantic_map = {
            "CODING": "CODING_ACTIVITY",
            "RESEARCH": "RESEARCH_ACTIVITY",
            "MEETING": "MEETING_ACTIVE",
            "COMMUNICATION": "RESEARCH_ACTIVITY",
            "FILE_MANAGEMENT": "FILE_MANAGEMENT_ACTIVITY",
            "UNKNOWN": "UNKNOWN_ACTIVITY"
        }
        semantic_output = semantic_map.get(category, "UNKNOWN_ACTIVITY")

        return {
            "id": self.sensor_id,
            "label": self.label,
            "enabled": True,
            "available": True,
            "state": "active",
            "activityLevel": 85 if category in ["CODING", "RESEARCH", "MEETING"] else 40,
            "activeApp": app_name,
            "windowTitle": window_title,
            "category": category,
            "semantic_outputs": [semantic_output],
            "description": f"Active: {app_name} [{category}] — {window_title[:30]}"
        }
