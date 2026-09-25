from platform import get_platform_adapter
from platform.base import CapabilityState

DEFAULT_APP_CATEGORY_MAP = {
    "vscode": "CODING",
    "code": "CODING",
    "visual studio": "CODING",
    "pycharm": "CODING",
    "intellij": "CODING",
    "terminal": "CODING",
    "powershell": "CODING",
    "cmd": "CODING",
    "bash": "CODING",
    "zsh": "CODING",

    "chrome": "RESEARCH",
    "edge": "RESEARCH",
    "firefox": "RESEARCH",
    "brave": "RESEARCH",
    "safari": "RESEARCH",

    "zoom": "MEETING",
    "teams": "MEETING",
    "meet": "MEETING",
    "slack": "COMMUNICATION",
    "discord": "COMMUNICATION",
    "skype": "MEETING",

    "explorer": "FILE_MANAGEMENT",
    "finder": "FILE_MANAGEMENT",
    "nautilus": "FILE_MANAGEMENT",

    "1password": "PROTECTED",
    "bitwarden": "PROTECTED",
    "keepass": "PROTECTED"
}

class ScreenSensor:
    """Privacy-first active window and application context detector."""

    def __init__(self, category_map=None):
        self.category_map = category_map or DEFAULT_APP_CATEGORY_MAP
        self.enabled = True

    def classify_category(self, app_name: str, window_title: str) -> str:
        text = f"{app_name} {window_title}".lower()
        for key, cat in self.category_map.items():
            if key in text:
                return cat
        return "GENERAL"

    def read(self) -> dict:
        if not self.enabled:
            return {
                "sensor": "screen",
                "enabled": False,
                "available": True,
                "state": "off",
                "active_app": "None",
                "window_title": "Sensing disabled",
                "category": "UNKNOWN"
            }

        adapter = get_platform_adapter()
        capabilities = adapter.get_capabilities()
        window_cap = capabilities.get("window_context", CapabilityState.AVAILABLE)

        if window_cap == CapabilityState.NOT_SUPPORTED:
            return {
                "sensor": "screen",
                "enabled": True,
                "available": False,
                "capability_state": CapabilityState.NOT_SUPPORTED.value,
                "state": "limited",
                "active_app": "Desktop",
                "window_title": "Application context is limited on this environment",
                "category": "GENERAL"
            }

        app_name, title = adapter.get_window_context()
        category = self.classify_category(app_name, title)

        return {
            "sensor": "screen",
            "enabled": True,
            "available": True,
            "capability_state": CapabilityState.AVAILABLE.value,
            "state": "active",
            "active_app": app_name,
            "window_title": title,
            "category": category
        }
