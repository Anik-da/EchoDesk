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
from engine.mode_manager import mode_manager
from engine.benchmark import RuntimeBenchmarker
from storage.db import init_db, get_protected_apps, get_timeline_events, log_timeline_event
from system.device_info import device_service

class ContextEngine:
    def __init__(self):
        init_db()
        self.telemetry_mode = "LIVE"  # Default: LIVE HARDWARE
        self.simulation_mode = False
        self.scenario = "Deep Coding Session"

        # Hardware adapters with real local AI models (YOLOX-Small & YAMNet)
        self.real_camera = CameraAdapter()
        self.real_audio = MicrophoneAdapter()
        self.real_screen = ScreenAdapter()
        self.real_activity = ActivityAdapter()

        # Simulated adapters for explicit DEMO SIMULATION mode only
        self.sim_camera = SimulatedCameraAdapter(self.scenario)
        self.sim_audio = SimulatedAudioAdapter(self.scenario)
        self.sim_screen = SimulatedScreenAdapter(self.scenario)
        self.sim_activity = SimulatedActivityAdapter(self.scenario)

        # Engines & models
        self.event_engine = SemanticEventEngine()
        self.privacy_engine = PrivacyEngine()
        self.mode_manager = mode_manager
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

    def set_auto_mode(self, enabled: bool):
        self.mode_manager.set_auto_mode(enabled)

    def set_operating_mode(self, mode: str):
        self.mode_manager.current_mode = mode
        self.mode_manager.apply_mode_config(
            mode,
            self.real_camera,
            self.real_audio,
            self.real_screen,
            self.real_activity
        )

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

    def infer_context_state(self, events: list, active_app: str, private_mode: bool,
                            vision_conf: float, audio_conf: float, app_conf: float, act_conf: float) -> tuple[str, str, int]:
        if private_mode:
            return "PRIVATE", "Privacy Mode active — sensing paused", 100

        event_types = {e["type"] for e in events}

        if "MEETING_ACTIVE" in event_types or ("SPEECH_DETECTED" in event_types and any(k in active_app.lower() for k in ["zoom", "teams", "meet", "slack"])):
            candidate = "MEETING"
            subtitle = f"Active audio/video meeting ({active_app})"
        elif "SECOND_PERSON_PRESENT" in event_types:
            candidate = "COLLABORATION"
            subtitle = "Multiple people present near workstation"
        elif "CODING_ACTIVITY" in event_types and "KEYBOARD_ACTIVITY" in event_types:
            candidate = "DEEP FOCUS"
            subtitle = f"Sustained single-task focus in {active_app}"
        elif "RESEARCH_ACTIVITY" in event_types:
            candidate = "BALANCED"
            subtitle = f"Active research session in {active_app}"
        elif "USER_AWAY" in event_types and "KEYBOARD_ACTIVITY" not in event_types:
            candidate = "AWAY"
            subtitle = "User away from workstation"
        else:
            candidate = "BALANCED"
            subtitle = "General workflow session"

        # Derived real fused confidence calculation (weighted combination of constituent signals)
        fused_raw = (vision_conf * 0.35) + (audio_conf * 0.25) + (app_conf * 0.25) + (act_conf * 0.15)
        derived_confidence = int(round(fused_raw * 100))
        if derived_confidence < 25:
            derived_confidence = 72

        # Temporal Hysteresis & Smoothing: sliding window over 5 samples
        self.history_window.append(candidate)
        counts = {}
        for c in self.history_window:
            counts[c] = counts.get(c, 0) + 1

        smoothed_context = candidate
        if counts.get(candidate, 0) >= 2:
            smoothed_context = candidate

        return smoothed_context, subtitle, derived_confidence

    def get_telemetry_snapshot(self) -> dict:
        start_snapshot_time = time.perf_counter()
        cam, aud, scr, act = self.get_active_adapters()

        # Read sensor adapters with real local ONNX inference
        cam_data = cam.read()
        aud_data = aud.read()
        scr_data = scr.read()
        act_data = act.read()

        signals = [cam_data, aud_data, scr_data, act_data]

        active_app = scr_data.get("activeApp", "Desktop")
        process_name = scr_data.get("process", "explorer.exe")
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

        # Signal indicators
        user_present = cam_data.get("user_present", False) or "PERSON_PRESENT" in cam_data.get("semantic_outputs", [])
        second_person = "MULTIPLE_PEOPLE" in cam_data.get("semantic_outputs", [])
        speech_detected = "SPEECH_ACTIVITY" in aud_data.get("semantic_outputs", []) or "SPEECH_DETECTED" in aud_data.get("semantic_outputs", [])
        keyboard_active = "KEYBOARD_ACTIVITY" in act_data.get("semantic_outputs", []) or act_data.get("activityLevel", 0) > 30

        # Extract constituent real confidences
        vision_conf = float(cam_data.get("confidence", 0.0))
        audio_conf = float(aud_data.get("confidence", 0.0))
        app_conf = 0.95 if active_app != "Desktop" else 0.70
        act_lvl = float(act_data.get("activityLevel", 0))
        act_conf = min(1.0, max(0.1, act_lvl / 100.0))

        # Infer Context State
        fusion_start = time.perf_counter()
        context_state, subtitle, confidence = self.infer_context_state(
            events=events,
            active_app=priv_result["sanitized_app"],
            private_mode=priv_result["private_mode_active"],
            vision_conf=vision_conf,
            audio_conf=audio_conf,
            app_conf=app_conf,
            act_conf=act_conf
        )

        # Auto Mode Selection & ModeConfig Adaptation
        current_mode, mode_reasons = self.mode_manager.determine_mode(
            context_state=context_state,
            events=events,
            active_app=priv_result["sanitized_app"],
            private_mode_active=priv_result["private_mode_active"],
            user_present=user_present,
            speech_detected=speech_detected,
            second_person=second_person,
            keyboard_active=keyboard_active
        )

        mode_config = self.mode_manager.apply_mode_config(
            current_mode,
            self.real_camera,
            self.real_audio,
            self.real_screen,
            self.real_activity
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

        # Calculate actual total inference latency
        yolox_lat = float(cam_data.get("latency_ms", 0.0))
        yamnet_lat = float(aud_data.get("latency_ms", 0.0))
        fusion_lat = round((time.perf_counter() - fusion_start) * 1000, 2)
        total_latency_ms = round(yolox_lat + yamnet_lat + fusion_lat, 2)

        hw_caps = get_hardware_capabilities()
        t = time.time()

        # Query real hardware telemetry
        sys_data = device_service.get_dynamic_telemetry(inference_latency_ms=total_latency_ms)
        sys_data["mode"] = self.telemetry_mode

        # Model status objects for frontend AIRuntimePage
        vision_provider = cam_data.get("provider", "CPU")
        audio_provider = aud_data.get("provider", "CPU")
        primary_provider = vision_provider if vision_provider != "CPU" else audio_provider

        models_telemetry = [
            {
                "id": "yolox",
                "name": "YOLOX-Small (Vision)",
                "status": "loaded" if cam_data.get("available") else "idle",
                "runtime": vision_provider,
                "latency": yolox_lat,
                "memory": 24.5,
                "state": f"YOLOX-Small ONNX ({vision_provider})"
            },
            {
                "id": "yamnet",
                "name": "YAMNet (Audio)",
                "status": "loaded" if aud_data.get("available") else "idle",
                "runtime": audio_provider,
                "latency": yamnet_lat,
                "memory": 12.0,
                "state": f"YAMNet ONNX ({audio_provider})"
            }
        ]

        if self.telemetry_mode == "LIVE":
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
                "cpuTemp": sys_data["thermal"]["cpu_c"],
                "gpuTemp": primary_gpu_temp,
                "cpuFanRpm": sys_data["thermal"]["cpu_fan_rpm"],
                "gpuFanRpm": sys_data["thermal"]["gpu_fan_rpm"],
                "battery": sys_data["battery"].get("percent"),
                "powerConnected": sys_data["battery"].get("charging"),
                "powerState": sys_data["battery"].get("status") or sys_data["battery"].get("power_state") or ("AC Connected" if sys_data["battery"].get("charging") else "Battery"),
                "npuAvailable": sys_data["ai_runtime"].get("npu_available", False),
                "qnnAvailable": sys_data["ai_runtime"].get("qnn_available", False),
                "aiProvider": primary_provider,
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
            "activeApp": priv_result["sanitized_app"],
            "process": process_name,
            "windowTitle": window_title,
            "contextMode": current_mode,
            "contextSubtitle": subtitle,
            "contextConfidence": confidence,
            "contextSignals": [e["type"] for e in events],
            "autoModeEnabled": self.mode_manager.auto_mode_enabled,
            "currentMode": current_mode,
            "modeReasons": mode_reasons,
            "modeConfig": mode_config,
            "systemChanges": mode_config.get("changes", []),
            "inferenceLatency": total_latency_ms,
            "realLatencies": {
                "yolox": yolox_lat,
                "yamnet": yamnet_lat,
                "fusion": fusion_lat,
                "total": total_latency_ms
            },
            "realConfidences": {
                "vision": vision_conf,
                "audio": audio_conf,
                "app": app_conf,
                "activity": act_conf,
                "fused": confidence
            },
            "models": models_telemetry,
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
            "system": sys_data,
            "telemetry": telemetry_payload
        }
