import time
import math
from adapters.base_adapter import BaseSensorAdapter

class SimulatedCameraAdapter(BaseSensorAdapter):
    def __init__(self, scenario="Deep Coding Session"):
        super().__init__(sensor_id="camera", sensor_type="camera", label="Camera Sensor (Simulated)")
        self.scenario = scenario

    def is_available(self) -> bool:
        return True

    def set_scenario(self, scenario: str):
        self.scenario = scenario

    def read(self) -> dict:
        if not self.enabled:
            return {"id": self.sensor_id, "label": self.label, "enabled": False, "available": True, "state": "off", "activityLevel": 0, "semantic_outputs": ["USER_AWAY"], "description": "Simulated camera disabled"}

        if self.scenario in ["Deep Coding Session", "Zoom Meeting"]:
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 85, "semantic_outputs": ["PERSON_PRESENT"], "description": "Simulated presence: User present at desk"}
        elif self.scenario == "Team Collaboration":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 95, "semantic_outputs": ["PERSON_PRESENT", "MULTIPLE_PEOPLE"], "description": "Simulated presence: Multiple people present"}
        else: # On Break or Away
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "low", "activityLevel": 0, "semantic_outputs": ["USER_AWAY", "NO_PERSON"], "description": "Simulated presence: User away"}

class SimulatedAudioAdapter(BaseSensorAdapter):
    def __init__(self, scenario="Deep Coding Session"):
        super().__init__(sensor_id="microphone", sensor_type="microphone", label="Microphone (Simulated)")
        self.scenario = scenario

    def is_available(self) -> bool:
        return True

    def set_scenario(self, scenario: str):
        self.scenario = scenario

    def read(self) -> dict:
        if not self.enabled:
            return {"id": self.sensor_id, "label": self.label, "enabled": False, "available": True, "state": "off", "activityLevel": 0, "semantic_outputs": ["SILENCE"], "description": "Simulated mic disabled"}

        if self.scenario == "Zoom Meeting":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 65, "semantic_outputs": ["SPEECH_DETECTED"], "description": "Simulated mic: Active speech detected"}
        elif self.scenario == "Team Collaboration":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 50, "semantic_outputs": ["SPEECH_DETECTED", "BACKGROUND_NOISE"], "description": "Simulated mic: Ambient conversation"}
        else:
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "low", "activityLevel": 15, "semantic_outputs": ["SILENCE"], "description": "Simulated mic: Quiet environment"}

class SimulatedScreenAdapter(BaseSensorAdapter):
    def __init__(self, scenario="Deep Coding Session"):
        super().__init__(sensor_id="screen", sensor_type="screen", label="Screen Context (Simulated)")
        self.scenario = scenario

    def is_available(self) -> bool:
        return True

    def set_scenario(self, scenario: str):
        self.scenario = scenario

    def read(self) -> dict:
        if not self.enabled:
            return {"id": self.sensor_id, "label": self.label, "enabled": False, "available": True, "state": "off", "activityLevel": 0, "activeApp": "None", "windowTitle": "Disabled", "semantic_outputs": ["UNKNOWN_ACTIVITY"], "description": "Simulated screen disabled"}

        if self.scenario == "Deep Coding Session":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 90, "activeApp": "VS Code", "windowTitle": "EchoDesk — App.tsx", "category": "CODING", "semantic_outputs": ["CODING_ACTIVITY"], "description": "Simulated app: VS Code"}
        elif self.scenario == "Zoom Meeting":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 80, "activeApp": "Zoom", "windowTitle": "Team Sync Meeting", "category": "MEETING", "semantic_outputs": ["MEETING_ACTIVE"], "description": "Simulated app: Zoom Meeting"}
        elif self.scenario == "Team Collaboration":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 75, "activeApp": "Slack", "windowTitle": "#project-echodesk", "category": "COMMUNICATION", "semantic_outputs": ["RESEARCH_ACTIVITY"], "description": "Simulated app: Slack"}
        elif self.scenario == "Protected App Active":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 40, "activeApp": "1Password", "windowTitle": "1Password Vault", "category": "PROTECTED", "semantic_outputs": ["UNKNOWN_ACTIVITY"], "description": "Simulated app: 1Password"}
        else:
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "low", "activityLevel": 10, "activeApp": "Desktop", "windowTitle": "Windows Desktop", "category": "UNKNOWN", "semantic_outputs": ["UNKNOWN_ACTIVITY"], "description": "Simulated app: Desktop"}

class SimulatedActivityAdapter(BaseSensorAdapter):
    def __init__(self, scenario="Deep Coding Session"):
        super().__init__(sensor_id="activity", sensor_type="activity", label="Keyboard & Mouse (Simulated)")
        self.scenario = scenario

    def is_available(self) -> bool:
        return True

    def set_scenario(self, scenario: str):
        self.scenario = scenario

    def read(self) -> dict:
        if not self.enabled:
            return {"id": self.sensor_id, "label": self.label, "enabled": False, "available": True, "state": "off", "activityLevel": 0, "semantic_outputs": ["IDLE"], "description": "Simulated activity disabled"}

        if self.scenario == "Deep Coding Session":
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 88, "semantic_outputs": ["ACTIVE", "KEYBOARD_ACTIVITY"], "description": "Simulated activity: High typing density"}
        elif self.scenario in ["Zoom Meeting", "Team Collaboration"]:
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "active", "activityLevel": 45, "semantic_outputs": ["ACTIVE", "MOUSE_ACTIVITY"], "description": "Simulated activity: Moderate input"}
        else:
            return {"id": self.sensor_id, "label": self.label, "enabled": True, "available": True, "state": "off", "activityLevel": 0, "semantic_outputs": ["IDLE"], "description": "Simulated activity: System idle"}
