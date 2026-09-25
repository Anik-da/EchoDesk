import os
import sys
import ctypes
import subprocess
import json
import importlib
from platform.base import PlatformBase, CapabilityState

_std_platform = importlib.import_module("platform")

try:
    import winreg
except ImportError:
    winreg = None

class WindowsPlatform(PlatformBase):
    """Windows-specific platform adapter utilizing Win32 APIs, WMI, and Registry."""

    def __init__(self):
        self._cached_identity = None

    def get_os_info(self) -> dict:
        return {
            "os": "windows",
            "os_name": "Windows",
            "release": _std_platform.release(),
            "version": _std_platform.version(),
            "architecture": _std_platform.machine(),
            "platform_string": _std_platform.platform()
        }

    def get_device_identity(self) -> dict:
        if self._cached_identity is not None:
            return self._cached_identity

        manufacturer = "Unknown"
        model = "Unknown"
        board = "Unknown"

        # 1. Try PowerShell CimInstance Win32_ComputerSystem
        try:
            cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_ComputerSystem | Select-Object -Property Manufacturer, Model | ConvertTo-Json"]
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if proc.returncode == 0 and proc.stdout.strip():
                data = json.loads(proc.stdout)
                if isinstance(data, list) and len(data) > 0:
                    data = data[0]
                m = data.get("Manufacturer", "").strip()
                mod = data.get("Model", "").strip()
                if m and m.lower() not in ("to be filled by o.e.m.", "system manufacturer"):
                    manufacturer = m
                if mod and mod.lower() not in ("to be filled by o.e.m.", "system product name"):
                    model = mod
        except Exception:
            pass

        # 2. Try BaseBoard if model/manufacturer still generic or missing
        if model in ("Unknown", "System Product Name", "") or manufacturer in ("Unknown", ""):
            try:
                cmd = ["powershell", "-NoProfile", "-Command", "Get-CimInstance Win32_BaseBoard | Select-Object -Property Manufacturer, Product | ConvertTo-Json"]
                proc = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
                if proc.returncode == 0 and proc.stdout.strip():
                    data = json.loads(proc.stdout)
                    if isinstance(data, list) and len(data) > 0:
                        data = data[0]
                    if manufacturer == "Unknown":
                        m = data.get("Manufacturer", "").strip()
                        if m and m.lower() not in ("to be filled by o.e.m.", "system manufacturer"):
                            manufacturer = m
                    b = data.get("Product", "").strip()
                    if b and b.lower() not in ("to be filled by o.e.m.", "baseboard product"):
                        board = b
                        if model == "Unknown":
                            model = b
            except Exception:
                pass

        # 3. Fallback to Windows Registry BIOS info
        if winreg and (manufacturer == "Unknown" or model == "Unknown"):
            try:
                key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"HARDWARE\DESCRIPTION\System\BIOS")
                if manufacturer == "Unknown":
                    val, _ = winreg.QueryValueEx(key, "SystemManufacturer")
                    if val and val.strip():
                        manufacturer = val.strip()
                if model == "Unknown":
                    val, _ = winreg.QueryValueEx(key, "SystemProductName")
                    if val and val.strip():
                        model = val.strip()
                winreg.CloseKey(key)
            except Exception:
                pass

        self._cached_identity = {
            "manufacturer": manufacturer,
            "model": model,
            "motherboard": board,
            "platform": "windows"
        }
        return self._cached_identity

    def get_app_data_dir(self) -> str:
        app_data = os.environ.get("APPDATA")
        if not app_data:
            app_data = os.path.expanduser(r"~\AppData\Roaming")
        target_dir = os.path.join(app_data, "EchoDesk")
        os.makedirs(target_dir, exist_ok=True)
        return target_dir

    def get_window_context(self) -> tuple[str, str]:
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
                app_name = parts[1].strip() if len(parts) > 1 and len(parts[1].strip()) > 0 else title[:25].strip()

            return app_name or "Active Application", title
        except Exception:
            return "Active Application", "Windows Application"

    def get_idle_time_ms(self) -> int:
        try:
            class LASTINPUTINFO(ctypes.Structure):
                _fields_ = [("cbSize", ctypes.c_uint), ("dwTime", ctypes.c_uint)]

            lii = LASTINPUTINFO()
            lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
            if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
                millis = ctypes.windll.kernel32.GetTickCount() - lii.dwTime
                return max(0, millis)
        except Exception:
            pass
        return 0

    def get_cursor_pos(self) -> tuple[int, int]:
        try:
            class POINT(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

            pt = POINT()
            ctypes.windll.user32.GetCursorPos(ctypes.byref(pt))
            return (pt.x, pt.y)
        except Exception:
            return (0, 0)

    def get_capabilities(self) -> dict:
        return {
            "window_context": CapabilityState.AVAILABLE,
            "aggregate_activity": CapabilityState.AVAILABLE,
            "directml": CapabilityState.AVAILABLE,
            "camera_access": CapabilityState.AVAILABLE,
            "audio_input": CapabilityState.AVAILABLE
        }
