import os
import sys
import subprocess
import json
import importlib
from platform.base import PlatformBase, CapabilityState

_std_platform = importlib.import_module("platform")

class MacOSPlatform(PlatformBase):
    """macOS-specific platform adapter utilizing sysctl, system_profiler, and AppleScript/CoreGraphics."""

    def __init__(self):
        self._cached_identity = None

    def get_os_info(self) -> dict:
        version = "Unknown"
        try:
            proc = subprocess.run(["sw_vers", "-productVersion"], capture_output=True, text=True, timeout=2)
            if proc.returncode == 0:
                version = proc.stdout.strip()
        except Exception:
            version = _std_platform.mac_ver()[0] or _std_platform.release()

        return {
            "os": "macos",
            "os_name": "macOS",
            "release": _std_platform.release(),
            "version": version,
            "architecture": _std_platform.machine(),
            "platform_string": f"macOS {version} ({_std_platform.machine()})"
        }

    def get_device_identity(self) -> dict:
        if self._cached_identity is not None:
            return self._cached_identity

        manufacturer = "Apple"
        model = "Mac"

        try:
            # Query sysctl for hardware model (e.g. MacBookPro18,1, Mac14,2)
            proc = subprocess.run(["sysctl", "-n", "hw.model"], capture_output=True, text=True, timeout=2)
            if proc.returncode == 0 and proc.stdout.strip():
                model = proc.stdout.strip()
        except Exception:
            pass

        # Try friendly model name via system_profiler if available
        try:
            proc = subprocess.run(["system_profiler", "SPHardwareDataType", "-json"], capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                hw_items = data.get("SPHardwareDataType", [])
                if hw_items:
                    friendly_name = hw_items[0].get("machine_name")
                    if friendly_name:
                        model = f"{friendly_name} ({model})"
        except Exception:
            pass

        self._cached_identity = {
            "manufacturer": manufacturer,
            "model": model,
            "motherboard": "Apple Logic Board",
            "platform": "macos"
        }
        return self._cached_identity

    def get_app_data_dir(self) -> str:
        home = os.path.expanduser("~")
        target_dir = os.path.join(home, "Library", "Application Support", "EchoDesk")
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    def get_window_context(self) -> tuple[str, str]:
        """Detect frontmost macOS application via osascript without intrusive permissions."""
        try:
            script = 'tell application "System Events" to get name of first application process whose frontmost is true'
            proc = subprocess.run(["osascript", "-e", script], capture_output=True, text=True, timeout=2)
            if proc.returncode == 0 and proc.stdout.strip():
                app_name = proc.stdout.strip()
                return app_name, f"{app_name} Workspace"
        except Exception:
            pass
        return "macOS Desktop", "Active Workspace"

    def get_idle_time_ms(self) -> int:
        """Detect idle time using ioreg HIDIdleTime on macOS."""
        try:
            proc = subprocess.run(
                ["ioreg", "-c", "IOHIDSystem"],
                capture_output=True, text=True, timeout=2
            )
            if proc.returncode == 0:
                for line in proc.stdout.splitlines():
                    if "HIDIdleTime" in line:
                        parts = line.split("=")
                        if len(parts) == 2:
                            nanos = int(parts[1].strip())
                            return int(nanos / 1_000_000)
        except Exception:
            pass
        return 0

    def get_cursor_pos(self) -> tuple[int, int]:
        # On macOS, without pyobjc Quartz, return (0, 0)
        return (0, 0)

    def get_capabilities(self) -> dict:
        return {
            "window_context": CapabilityState.AVAILABLE,
            "aggregate_activity": CapabilityState.AVAILABLE,
            "coreml": CapabilityState.AVAILABLE,
            "camera_access": CapabilityState.AVAILABLE,
            "audio_input": CapabilityState.AVAILABLE
        }
