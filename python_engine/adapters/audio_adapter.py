import time
import math

class AudioAdapter:
    def __init__(self):
        self.enabled = True
        self.speech_detected = False

    def read(self):
        if not self.enabled:
            return {
                "id": "microphone",
                "label": "Microphone",
                "enabled": False,
                "state": "off",
                "activityLevel": 0,
                "speechDetected": False,
                "description": "On-device voice activity detection"
            }

        t = time.time()
        # Modulated ambient noise level
        level = int(25 + 10 * math.cos(t * 0.3))
        speech = level > 32

        return {
            "id": "microphone",
            "label": "Microphone",
            "enabled": True,
            "state": "active" if speech else "low",
            "activityLevel": level,
            "speechDetected": speech,
            "description": "Voice activity: " + ("Speech detected (local VAD)" if speech else "Quiet ambient background")
        }
