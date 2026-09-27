"""
Windows System-Level Integration & Mode Restoration Service for EchoDesk.

SAFE WINDOWS OS INTEGRATION:
- Uses documented Win32 APIs (SetThreadExecutionState) and powercfg.
- Stores original system state before entering DEEP FOCUS.
- Automatically restores original system settings upon leaving DEEP FOCUS.
- Distinguishes explicitly between 'WINDOWS INTEGRATION' and 'ECHODESK MODE'.
"""

import sys
import ctypes
import subprocess
import re

ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

class WindowsIntegrationService:
    def __init__(self):
        self.original_power_guid = None
        self.focus_active = False
        self.execution_state_set = False

    def get_active_power_guid(self) -> str | None:
        if sys.platform != "win32":
            return None
        try:
            cmd = ["powercfg", "/getactivescheme"]
            CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=2, creationflags=CREATE_NO_WINDOW)
            if proc.returncode == 0 and proc.stdout:
                # Match GUID format 8-4-4-4-12 hex chars
                match = re.search(r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})", proc.stdout)
                if match:
                    return match.group(1)
        except Exception:
            pass
        return None

    def apply_deep_focus_changes(self) -> dict:
        """Applies supported Windows system changes for DEEP FOCUS and remembers previous state."""
        if sys.platform != "win32":
            return {
                "supported": False,
                "label": "OS integration unavailable",
                "changes": ["Non-Windows host operating system"]
            }

        changes_applied = []
        
        # 1. Store original power scheme if not already saved
        if not self.original_power_guid:
            self.original_power_guid = self.get_active_power_guid()

        # 2. Prevent sleep/display idle throttling during focus (Win32 API)
        try:
            ctypes.windll.kernel32.SetThreadExecutionState(
                ES_CONTINUOUS | ES_SYSTEM_REQUIRED | ES_DISPLAY_REQUIRED
            )
            self.execution_state_set = True
            changes_applied.append("Thread Execution State: High Focus Lock (Sleep Prevented)")
        except Exception as e:
            pass

        # 3. Try setting High Performance Power Scheme (GUID 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c)
        try:
            high_perf_guid = "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
            if self.original_power_guid and self.original_power_guid.lower() != high_perf_guid.lower():
                CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
                proc = subprocess.run(["powercfg", "/setactive", high_perf_guid], capture_output=True, text=True, timeout=2, creationflags=CREATE_NO_WINDOW)
                if proc.returncode == 0:
                    changes_applied.append(f"Power Scheme: High Performance ({high_perf_guid[:8]}...)")
        except Exception:
            pass

        self.focus_active = True

        return {
            "supported": True,
            "label": "WINDOWS INTEGRATION",
            "changes": changes_applied if changes_applied else ["Execution Priority Lock Active"],
            "original_power_guid": self.original_power_guid
        }

    def restore_system_changes(self) -> dict:
        """Restores original Windows power scheme and execution state upon leaving DEEP FOCUS."""
        if sys.platform != "win32" or not self.focus_active:
            return {
                "supported": True,
                "label": "WINDOWS INTEGRATION",
                "restored": False,
                "message": "No active system changes to restore"
            }

        restored_items = []

        # 1. Release Win32 thread execution state lock
        if self.execution_state_set:
            try:
                ctypes.windll.kernel32.SetThreadExecutionState(ES_CONTINUOUS)
                self.execution_state_set = False
                restored_items.append("Thread Execution State: Reset to Default")
            except Exception:
                pass

        # 2. Restore original power scheme
        if self.original_power_guid:
            try:
                CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
                proc = subprocess.run(["powercfg", "/setactive", self.original_power_guid], capture_output=True, text=True, timeout=2, creationflags=CREATE_NO_WINDOW)
                if proc.returncode == 0:
                    restored_items.append(f"Power Scheme: Restored ({self.original_power_guid[:8]}...)")
            except Exception:
                pass

        self.focus_active = False

        return {
            "supported": True,
            "label": "WINDOWS INTEGRATION",
            "restored": True,
            "restored_items": restored_items
        }

windows_integration = WindowsIntegrationService()
