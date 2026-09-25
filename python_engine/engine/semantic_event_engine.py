import time

class SemanticEventEngine:
    """Normalizes raw outputs from camera, mic, screen, and activity adapters into semantic events."""
    def __init__(self):
        pass

    def generate_events(self, camera_data: dict, audio_data: dict, screen_data: dict, activity_data: dict) -> list:
        now = time.time()
        events = []

        # 1. Camera Events
        cam_semantics = camera_data.get("semantic_outputs", [])
        if "PERSON_PRESENT" in cam_semantics:
            events.append({
                "timestamp": now,
                "type": "PERSON_PRESENT",
                "confidence": 92 if camera_data.get("available") else 75,
                "sources": ["camera"],
                "metadata": {"activity_level": camera_data.get("activityLevel", 0)}
            })
        if "MULTIPLE_PEOPLE" in cam_semantics:
            events.append({
                "timestamp": now,
                "type": "SECOND_PERSON_PRESENT",
                "confidence": 88,
                "sources": ["camera"],
                "metadata": {"multi_face": True}
            })
        if "USER_AWAY" in cam_semantics or "NO_PERSON" in cam_semantics:
            events.append({
                "timestamp": now,
                "type": "USER_AWAY",
                "confidence": 95,
                "sources": ["camera"],
                "metadata": {}
            })

        # 2. Audio Events
        audio_semantics = audio_data.get("semantic_outputs", [])
        if "SPEECH_DETECTED" in audio_semantics:
            events.append({
                "timestamp": now,
                "type": "SPEECH_DETECTED",
                "confidence": 90,
                "sources": ["microphone"],
                "metadata": {"volume": audio_data.get("activityLevel", 0)}
            })
        if "SILENCE" in audio_semantics:
            events.append({
                "timestamp": now,
                "type": "QUIET_ENVIRONMENT",
                "confidence": 85,
                "sources": ["microphone"],
                "metadata": {}
            })
        if "BACKGROUND_NOISE" in audio_semantics or "KEYBOARD_SOUND" in audio_semantics:
            events.append({
                "timestamp": now,
                "type": "HIGH_NOISE",
                "confidence": 78,
                "sources": ["microphone"],
                "metadata": {"volume": audio_data.get("activityLevel", 0)}
            })

        # 3. Screen Application Events
        screen_semantics = screen_data.get("semantic_outputs", [])
        if "CODING_ACTIVITY" in screen_semantics:
            events.append({
                "timestamp": now,
                "type": "CODING_ACTIVITY",
                "confidence": 96,
                "sources": ["screen"],
                "metadata": {"app": screen_data.get("activeApp", "VS Code")}
            })
        if "RESEARCH_ACTIVITY" in screen_semantics:
            events.append({
                "timestamp": now,
                "type": "RESEARCH_ACTIVITY",
                "confidence": 88,
                "sources": ["screen"],
                "metadata": {"app": screen_data.get("activeApp", "Browser")}
            })
        if "MEETING_ACTIVE" in screen_semantics:
            events.append({
                "timestamp": now,
                "type": "MEETING_ACTIVE",
                "confidence": 94,
                "sources": ["screen"],
                "metadata": {"app": screen_data.get("activeApp", "Zoom")}
            })

        # 4. Activity Events
        act_semantics = activity_data.get("semantic_outputs", [])
        if "KEYBOARD_ACTIVITY" in act_semantics:
            events.append({
                "timestamp": now,
                "type": "KEYBOARD_ACTIVITY",
                "confidence": 90,
                "sources": ["activity"],
                "metadata": {"density": activity_data.get("activityLevel", 0)}
            })
        if "IDLE" in act_semantics:
            events.append({
                "timestamp": now,
                "type": "USER_AWAY",
                "confidence": 85,
                "sources": ["activity"],
                "metadata": {}
            })

        return events
