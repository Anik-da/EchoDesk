from abc import ABC, abstractmethod

class BaseSensorAdapter(ABC):
    """Abstract Base Class for all EchoDesk sensor adapters."""
    def __init__(self, sensor_id: str, sensor_type: str, label: str):
        self.sensor_id = sensor_id
        self.sensor_type = sensor_type
        self.label = label
        self.enabled = True
        self.available = True
        self.error_message = None

    @abstractmethod
    def is_available(self) -> bool:
        """Check if hardware/driver is available on the host system."""
        pass

    @abstractmethod
    def read(self) -> dict:
        """Read current sensor output. Raw buffers MUST be released before returning."""
        pass

    def set_enabled(self, enabled: bool):
        self.enabled = enabled
