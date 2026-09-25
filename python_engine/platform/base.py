import os
import sys
import abc
from enum import Enum

class CapabilityState(str, Enum):
    AVAILABLE = "AVAILABLE"
    UNAVAILABLE = "UNAVAILABLE"
    NOT_SUPPORTED = "NOT_SUPPORTED"
    PERMISSION_REQUIRED = "PERMISSION_REQUIRED"
    ERROR = "ERROR"

class PlatformBase(abc.ABC):
    """Abstract base class for OS-specific platform adapters."""

    @abc.abstractmethod
    def get_os_info(self) -> dict:
        """Returns OS identity, release, version, and architecture."""
        pass

    @abc.abstractmethod
    def get_device_identity(self) -> dict:
        """Returns device manufacturer, model, motherboard, and chassis."""
        pass

    @abc.abstractmethod
    def get_app_data_dir(self) -> str:
        """Returns standard OS application data directory for persistent database/config."""
        pass

    @abc.abstractmethod
    def get_window_context(self) -> tuple[str, str]:
        """Returns (active_application_name, window_title)."""
        pass

    @abc.abstractmethod
    def get_idle_time_ms(self) -> int:
        """Returns system aggregate idle time in milliseconds."""
        pass

    @abc.abstractmethod
    def get_cursor_pos(self) -> tuple[int, int]:
        """Returns current cursor (x, y) coordinates for aggregate velocity."""
        pass

    @abc.abstractmethod
    def get_capabilities(self) -> dict:
        """Returns capability states for platform-dependent features."""
        pass
