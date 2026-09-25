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
from system.device_info import device_service

class ContextEngine:
    def __init__(self):
        init_db()
        self.telemetry_mode = "LIVE"  # Default: LIVE HARDWARE
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

    def set_telemetry_mode(self, mode: str):
        if mode in ("LIVE", "SIMULATION"):
            self.telemetry_mode = mode
            self.simulation_mode = (mode == "SIMULATION")

    def set_simulation_mode(self, enabled: bool):
        self.simulation_mode = enabled
        self.telemetry_mode = "SIMULATION" if enabled else "LIVE"

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

        # Query real hardware telemetry
        sys_data = device_service.get_dynamic_telemetry(inference_latency_ms=bench["inferenceLatencyMs"])
        sys_data["mode"] = self.telemetry_mode

        if self.telemetry_mode == "LIVE":
            # Real hardware telemetry mapping
            primary_gpu_usage = None
            primary_gpu_temp = sys_data["thermal"]["gpu_c"]
            for g in sys_data["gpu"]:
                if g.get("usage_percent") is not None:
                    primary_gpu_usage = g["usage_percent"]
                    break

            telemetry_payload = {
                "cpu": sys_data["cpu"]["usage_percent"],
                "cpuName": sys_data["cpu"]["name"],
                "cpuCores": sys_data["cpu"]["cores"],
                "cpuThreads": sys_data["cpu"]["threads"],
                "gpu": primary_gpu_usage,
                "ram": sys_data["memory"]["used_gb"],
                "ramUsed": sys_data["memory"]["used_gb"],
                "ramTotal": sys_data["memory"]["total_gb"],
                "ramPercent": sys_data["memory"]["usage_percent"],
                "storageUsed": sys_data["storage"][0]["used_gb"] if sys_data["storage"] else None,
                "storageTotal": sys_data["storage"][0]["total_gb"] if sys_data["storage"] else None,
                "storagePercent": sys_data["storage"][0]["usage_percent"] if sys_data["storage"] else None,
                "temp": primary_gpu_temp,
                "cpuTemp": sys_data["thermal"]["cpu_c"],  # None -> UI renders "Unavailable"
                "gpuTemp": primary_gpu_temp,             # Real GPU temp if NVIDIA, else None
                "cpuFanRpm": sys_data["thermal"]["cpu_fan_rpm"],  # None -> UI renders "Unavailable"
                "gpuFanRpm": sys_data["thermal"]["gpu_fan_rpm"],  # None -> UI renders "Unavailable"
                "battery": sys_data["battery"].get("percent"),
                "powerConnected": sys_data["battery"].get("charging"),
                "powerState": sys_data["battery"].get("status") or sys_data["battery"].get("power_state") or ("AC Connected" if sys_data["battery"].get("charging") else "Battery"),
                "npuAvailable": sys_data["ai_runtime"].get("npu_available", False),
                "qnnAvailable": sys_data["ai_runtime"].get("qnn_available", False),
                "aiProvider": sys_data["ai_runtime"].get("provider", "CPU"),
                "telemetryMode": "LIVE HARDWARE"
            }
        else:
            # Explicit DEVELOPMENT SIMULATION mode
            cpu_val = round(16.0 + 5.0 * math.sin(t * 0.4), 1)
            ram_val = round(8.4 + 0.3 * math.cos(t * 0.2), 1)
            gpu_val = round(12.0 + 3.0 * math.sin(t * 0.5), 1)
            telemetry_payload = {
                "cpu": cpu_val,
                "cpuName": "Simulated Processor (Dev Mode)",
                "cpuCores": 8,
                "cpuThreads": 16,
                "gpu": gpu_val,
                "ram": ram_val,
                "ramUsed": ram_val,
                "ramTotal": 16.0,
                "ramPercent": round((ram_val / 16.0) * 100, 1),
                "storageUsed": 287,
                "storageTotal": 512,
                "storagePercent": 56.0,
                "temp": 45,
                "cpuTemp": 45,
                "gpuTemp": 43,
                "cpuFanRpm": 2396,
                "gpuFanRpm": 2100,
                "battery": 85,
                "powerConnected": True,
                "powerState": "Simulated AC Power",
                "npuAvailable": False,
                "qnnAvailable": False,
                "aiProvider": "CPU (Simulated)",
                "telemetryMode": "DEVELOPMENT SIMULATION"
            }

        return {
            "timestamp": t,
            "engineStatus": "ONLINE",
            "backendType": "PYTHON_NATIVE",
            "telemetryMode": "LIVE HARDWARE" if self.telemetry_mode == "LIVE" else "DEVELOPMENT SIMULATION",
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
            "system": sys_data,
            "telemetry": telemetry_payload
        }
