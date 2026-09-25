import os
import sys
import subprocess
import importlib
from platform.base import PlatformBase, CapabilityState

_std_platform = importlib.import_module("platform")

class LinuxPlatform(PlatformBase):
    """Linux-specific platform adapter using DMI, /proc, /etc/os-release, and X11/Wayland context."""

    def __init__(self):
        self._cached_identity = None

    def get_os_info(self) -> dict:
        distro_name = "Linux"
        distro_version = _std_platform.release()

        # Parse /etc/os-release
        if os.path.exists("/etc/os-release"):
            try:
                with open("/etc/os-release", "r") as f:
                    for line in f:
                        if line.startswith("PRETTY_NAME="):
                            distro_name = line.split("=", 1)[1].strip().strip('"')
                        elif line.startswith("VERSION_ID="):
                            distro_version = line.split("=", 1)[1].strip().strip('"')
            except Exception:
                pass

        return {
            "os": "linux",
            "os_name": distro_name,
            "release": _std_platform.release(),
            "version": distro_version,
            "architecture": _std_platform.machine(),
            "platform_string": f"{distro_name} ({_std_platform.release()})"
        }

    def get_device_identity(self) -> dict:
        if self._cached_identity is not None:
            return self._cached_identity

        manufacturer = "Unknown"
        model = "Unknown"
        board = "Unknown"

        # 1. Read standard DMI sysfs on Linux
        try:
            if os.path.exists("/sys/class/dmi/id/sys_vendor"):
                with open("/sys/class/dmi/id/sys_vendor", "r") as f:
                    val = f.read().strip()
                    if val and val.lower() not in ("system manufacturer", "to be filled by o.e.m."):
                        manufacturer = val
            if os.path.exists("/sys/class/dmi/id/product_name"):
                with open("/sys/class/dmi/id/product_name", "r") as f:
                    val = f.read().strip()
                    if val and val.lower() not in ("system product name", "to be filled by o.e.m."):
                        model = val
            if os.path.exists("/sys/class/dmi/id/board_name"):
                with open("/sys/class/dmi/id/board_name", "r") as f:
                    val = f.read().strip()
                    if val:
                        board = val
        except Exception:
            pass

        # 2. Try hostnamectl
        if manufacturer == "Unknown" or model == "Unknown":
            try:
                proc = subprocess.run(["hostnamectl"], capture_output=True, text=True, timeout=2)
                if proc.returncode == 0:
                    for line in proc.stdout.splitlines():
                        if "Hardware Model:" in line and model == "Unknown":
                            model = line.split(":", 1)[1].strip()
                        elif "Hardware Vendor:" in line and manufacturer == "Unknown":
                            manufacturer = line.split(":", 1)[1].strip()
            except Exception:
                pass

        self._cached_identity = {
            "manufacturer": manufacturer,
            "model": model,
            "motherboard": board,
            "platform": "linux"
        }
        return self._cached_identity

    def get_app_data_dir(self) -> str:
        xdg_data = os.environ.get("XDG_DATA_HOME")
        if not xdg_data:
            home = os.path.expanduser("~")
            xdg_data = os.path.join(home, ".local", "share")
        target_dir = os.path.join(xdg_data, "echodesk")
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    def get_window_context(self) -> tuple[str, str]:
        """Detect active window via xdotool or xprop (X11) or fallback on Wayland."""
        # 1. Try xdotool
        try:
            proc = subprocess.run(["xdotool", "getactivewindow", "getwindowname"], capture_output=True, text=True, timeout=1)
            if proc.returncode == 0 and proc.stdout.strip():
                title = proc.stdout.strip()
                return title.split(" - ")[-1] if " - " in title else title[:25], title
        except Exception:
            pass

        # 2. Try xprop
        try:
            cmd = "xprop -id $(xprop -root 32a _NET_ACTIVE_WINDOW | awk '{print $5}') WM_NAME"
            proc = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=1)
            if proc.returncode == 0 and "=" in proc.stdout:
                title = proc.stdout.split("=", 1)[1].strip().strip('"')
                return title[:20], title
        except Exception:
            pass

        # Check if Wayland is active
        is_wayland = "wayland" in os.environ.get("XDG_SESSION_TYPE", "").lower()
        if is_wayland:
            return "Wayland Workspace", "Wayland Compositor (Limited window introspection)"

        return "Linux Desktop", "Active Workspace"

    def get_idle_time_ms(self) -> int:
        try:
            proc = subprocess.run(["xprintidle"], capture_output=True, text=True, timeout=1)
            if proc.returncode == 0 and proc.stdout.strip().isdigit():
                return int(proc.stdout.strip())
        except Exception:
            pass
        return 0

    def get_cursor_pos(self) -> tuple[int, int]:
        try:
            proc = subprocess.run(["xdotool", "getmouselocation", "--shell"], capture_output=True, text=True, timeout=1)
            if proc.returncode == 0:
                lines = dict(l.split("=") for l in proc.stdout.strip().splitlines() if "=" in l)
                return (int(lines.get("X", 0)), int(lines.get("Y", 0)))
        except Exception:
            pass
        return (0, 0)

    def get_capabilities(self) -> dict:
        is_wayland = "wayland" in os.environ.get("XDG_SESSION_TYPE", "").lower()
        return {
            "window_context": CapabilityState.NOT_SUPPORTED if is_wayland else CapabilityState.AVAILABLE,
            "aggregate_activity": CapabilityState.AVAILABLE,
            "cuda": CapabilityState.AVAILABLE,
            "camera_access": CapabilityState.AVAILABLE,
            "audio_input": CapabilityState.AVAILABLE
        }
