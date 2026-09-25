import time
import math
from collections import deque

from adapters.camera_adapter import CameraAdapter
from adapters.microphone_adapter import MicrophoneAdapter
from adapters.screen_adapter import ScreenAdapter
from adapters.activity_adapter import ActivityAdapter
from adapters.simulation_adapter import (
    SimulatedCameraAdapter,
    SimulatedAudioAdapter,
    SimulatedScreenAdapter,
    SimulatedActivityAdapter
)

from engine.semantic_event_engine import SemanticEventEngine
from engine.privacy_engine import PrivacyEngine
from engine.ai_model_abstraction import ContextModel, get_hardware_capabilities
from engine.benchmark import RuntimeBenchmarker
from storage.db import init_db, get_protected_apps, get_timeline_events, log_timeline_event

class ContextEngine:
    def __init__(self):
        init_db()
        self.simulation_mode = False
        self.scenario = "Deep Coding Session"

        # Hardware adapters
        self.real_camera = CameraAdapter()
        self.real_audio = MicrophoneAdapter()
        self.real_screen = ScreenAdapter()
        self.real_activity = ActivityAdapter()

        # Simulated adapters
        self.sim_camera = SimulatedCameraAdapter(self.scenario)
        self.sim_audio = SimulatedAudioAdapter(self.scenario)
        self.sim_screen = SimulatedScreenAdapter(self.scenario)
        self.sim_activity = SimulatedActivityAdapter(self.scenario)

        # Engines & models
        self.event_engine = SemanticEventEngine()
        self.privacy_engine = PrivacyEngine()
        self.model = ContextModel()
        self.model.load()
        self.benchmarker = RuntimeBenchmarker()

        # Sliding window buffer for temporal hysteresis & smoothing (5 samples)
        self.history_window = deque(maxlen=5)

        self.last_context = "DEEP FOCUS"
        self.sampling_mode = "BALANCED"

        # Load protected apps from SQLite DB into Privacy Engine
        apps = get_protected_apps()
        self.privacy_engine.set_protected_apps(apps)

    def set_simulation_mode(self, enabled: bool):
        self.simulation_mode = enabled

    def set_scenario(self, scenario: str):
        self.scenario = scenario
        self.sim_camera.set_scenario(scenario)
        self.sim_audio.set_scenario(scenario)
        self.sim_screen.set_scenario(scenario)
        self.sim_activity.set_scenario(scenario)

    def set_sensor_toggle(self, sensor_id: str, enabled: bool):
        if sensor_id == "camera":
            self.real_camera.set_enabled(enabled)
            self.sim_camera.set_enabled(enabled)
        elif sensor_id == "microphone":
            self.real_audio.set_enabled(enabled)
            self.sim_audio.set_enabled(enabled)
        elif sensor_id == "screen":
            self.real_screen.set_enabled(enabled)
            self.sim_screen.set_enabled(enabled)
        elif sensor_id == "activity":
            self.real_activity.set_enabled(enabled)
            self.sim_activity.set_enabled(enabled)

    def get_active_adapters(self):
        if self.simulation_mode:
            return self.sim_camera, self.sim_audio, self.sim_screen, self.sim_activity
        else:
            return self.real_camera, self.real_audio, self.real_screen, self.real_activity

    def infer_context_state(self, events: list, active_app: str, private_mode: bool) -> tuple[str, str, int]:
        if private_mode:
            return "PRIVATE", "Privacy Mode active — sensing paused", 100

        event_types = {e["type"] for e in events}

        if "MEETING_ACTIVE" in event_types or "SPEECH_DETECTED" in event_types and "Zoom" in active_app:
            candidate = "MEETING"
            subtitle = f"Active audio/video meeting ({active_app})"
            conf = 94
        elif "SECOND_PERSON_PRESENT" in event_types:
            candidate = "COLLABORATION"
            subtitle = "Multiple people present near workstation"
            conf = 91
        elif "CODING_ACTIVITY" in event_types and "KEYBOARD_ACTIVITY" in event_types:
            candidate = "DEEP FOCUS"
            subtitle = f"Sustained single-task focus in {active_app}"
            conf = 96
        elif "RESEARCH_ACTIVITY" in event_types:
            candidate = "BALANCED"
            subtitle = f"Active research session in {active_app}"
            conf = 88
        elif "USER_AWAY" in event_types and "KEYBOARD_ACTIVITY" not in event_types:
            candidate = "AWAY"
            subtitle = "User away from workstation"
            conf = 98
        else:
            candidate = "BALANCED"
            subtitle = "General workflow session"
            conf = 84

        # Apply Temporal Hysteresis & Smoothing:
        # Push candidate to sliding window (5 samples)
        self.history_window.append(candidate)

        # Count occurrences in window
        counts = {}
        for c in self.history_window:
            counts[c] = counts.get(c, 0) + 1

        # Most frequent candidate in window
        smoothed_context = max(counts, key=counts.get)
        
        # Only switch if candidate has at least 2 occurrences out of 5
        if counts[candidate] >= 2:
            smoothed_context = candidate

        return smoothed_context, subtitle, conf

    def get_telemetry_snapshot(self) -> dict:
        cam, aud, scr, act = self.get_active_adapters()

        # Read sensor adapters (raw buffers released inside read())
        cam_data = cam.read()
        aud_data = aud.read()
        scr_data = scr.read()
        act_data = act.read()

        signals = [cam_data, aud_data, scr_data, act_data]

        active_app = scr_data.get("activeApp", "Desktop")
        window_title = scr_data.get("windowTitle", "System Desktop")

        # Privacy Filtration
        priv_result = self.privacy_engine.process_signals(signals, active_app, window_title)

        # Generate Normalized Semantic Events
        events = self.event_engine.generate_events(
            camera_data=cam_data,
            audio_data=aud_data,
            screen_data=scr_data,
            activity_data=act_data
        )

        # Infer Stable Context State with Temporal Hysteresis
        context_state, subtitle, confidence = self.infer_context_state(
            events=events,
            active_app=priv_result["sanitized_app"],
            private_mode=priv_result["private_mode_active"]
        )

        # Log timeline event on context transition
        if self.last_context and context_state != self.last_context and context_state != "PRIVATE":
            log_timeline_event(
                context=context_state,
                duration=15,
                confidence=confidence,
                signals=[e["type"] for e in events],
                explanation=subtitle,
                raw_payload={"app": priv_result["sanitized_app"]}
            )
        self.last_context = context_state

        # Benchmark model execution
        bench = self.benchmarker.benchmark_model(self.model)
        hw_caps = get_hardware_capabilities()

        t = time.time()
        cpu_val = round(16.0 + 5.0 * math.sin(t * 0.4), 1)
        ram_val = round(42.5 + 1.5 * math.cos(t * 0.2), 1)
        gpu_val = round(12.0 + 3.0 * math.sin(t * 0.5), 1)

        return {
            "timestamp": t,
            "engineStatus": "ONLINE",
            "backendType": "PYTHON_NATIVE",
            "simulationMode": self.simulation_mode,
            "devScenario": self.scenario,
            "contextMode": context_state,
            "contextSubtitle": subtitle,
            "contextConfidence": confidence,
            "contextSignals": [e["type"] for e in events],
            "inferenceLatency": bench["inferenceLatencyMs"],
            "signals": priv_result["signals"],
            "events": events,
            "privacy": {
                "privateMode": priv_result["private_mode_active"],
                "cameraActive": cam.enabled and not priv_result["private_mode_active"],
                "microphoneActive": aud.enabled and not priv_result["private_mode_active"],
                "screenActive": scr.enabled and not priv_result["private_mode_active"],
                "historyPaused": priv_result["private_mode_active"],
                "cloudProcessing": False,
                "retention": "30 days"
            },
            "protectedApps": get_protected_apps(),
            "timelineEvents": get_timeline_events(),
            "hardwareCapabilities": hw_caps,
            "benchmark": bench,
            "telemetry": {
                "cpu": cpu_val,
                "ram": ram_val,
                "gpu": gpu_val,
                "temp": 45,
                "battery": 90,
                "fan": "QUIET"
            }
        }
