"""
EchoDesk Real Mode Manager & Operational Configuration.

Handles:
- Automatic Mode Selection (AUTO MODE)
- Real ModeConfig execution (Sampling rates, sensitivity, AI workload)
- Hard Privacy Boundary (PRIVATE MODE)
- Supported Windows OS System Integration & State Restoration
- Dynamic Event-Derived Mode Reason Explanations
"""

from system.windows_integration import windows_integration

class ModeManager:
    def __init__(self):
        self.auto_mode_enabled = True
        self.current_mode = "DEEP FOCUS"
        self.previous_mode = None
        self.mode_reasons = []
        self.mode_config = {}

    def set_auto_mode(self, enabled: bool):
        self.auto_mode_enabled = enabled

    def determine_mode(self, context_state: str, events: list, active_app: str,
                       private_mode_active: bool, user_present: bool,
                       speech_detected: bool, second_person: bool,
                       keyboard_active: bool) -> tuple[str, list[str]]:
        """Determines operating mode and returns (mode_name, event_derived_reasons)."""

        if private_mode_active:
            return "PRIVATE", [
                "✓ Privacy Kill-Switch activated by user",
                "✓ Sensing paused for all hardware adapters",
                "✓ Local AI inference halted"
            ]

        # If Auto Mode is disabled, retain manual selection
        if not self.auto_mode_enabled:
            return self.current_mode, [
                "▲ Manual Mode Selection active",
                f"✓ Current profile manually set to {self.current_mode}"
            ]

        reasons = []

        # Auto Mode Selection Rules based on real empirical sensor signals & context
        if context_state == "MEETING" or "MEETING_ACTIVE" in [e.get("type") for e in events]:
            mode = "MEETING"
            if active_app and active_app != "Desktop":
                reasons.append(f"✓ Meeting application active ({active_app})")
            if speech_detected:
                reasons.append("✓ Speech activity detected by YAMNet")
            if user_present:
                reasons.append("✓ User present at workstation")

        elif context_state == "COLLABORATION" or second_person:
            mode = "COLLABORATION"
            if second_person:
                reasons.append("✓ Multiple people detected near workstation by YOLOX-Small")
            if speech_detected:
                reasons.append("✓ Speech activity detected by YAMNet")
            if active_app and active_app != "Desktop":
                reasons.append(f"✓ Interactive session in {active_app}")

        elif context_state == "DEEP FOCUS" or (context_state == "FOCUS" and keyboard_active):
            mode = "DEEP FOCUS"
            if active_app and active_app != "Desktop":
                reasons.append(f"✓ Sustained single-task focus in {active_app}")
            if user_present:
                reasons.append("✓ User present at workstation")
            if keyboard_active:
                reasons.append("✓ High typing activity density")
            if not speech_detected:
                reasons.append("✓ Low environmental audio activity")

        elif context_state in ("AWAY", "BREAK") or (not user_present and not keyboard_active):
            mode = "BALANCED"
            reasons.append("✓ User away / idle threshold reached")
            reasons.append("✓ Low-power background sampling active")

        else:
            mode = "BALANCED"
            if active_app and active_app != "Desktop":
                reasons.append(f"✓ Active workflow in {active_app}")
            reasons.append("✓ Standard operational profile")

        return mode, reasons

    def apply_mode_config(self, new_mode: str, camera_adapter, audio_adapter, screen_adapter, activity_adapter) -> dict:
        """Applies real operational configuration changes to EchoDesk adapters and OS settings."""
        if self.current_mode == new_mode:
            return self.mode_config

        old_mode = self.current_mode
        self.previous_mode = old_mode
        self.current_mode = new_mode

        config = {
            "mode": new_mode,
            "sampling_freq_hz": 1.0,
            "os_integration_status": "NONE",
            "camera_enabled": True,
            "microphone_enabled": True,
            "screen_enabled": True,
            "activity_enabled": True,
            "changes": []
        }

        # 1. HARD PRIVACY BOUNDARY (PRIVATE MODE)
        if new_mode == "PRIVATE":
            camera_adapter.set_enabled(False)
            audio_adapter.set_enabled(False)
            screen_adapter.set_enabled(False)
            activity_adapter.set_enabled(False)

            # Restore any active OS power settings if coming from DEEP FOCUS
            if old_mode == "DEEP FOCUS":
                windows_integration.restore_system_changes()

            config.update({
                "camera_enabled": False,
                "microphone_enabled": False,
                "screen_enabled": False,
                "activity_enabled": False,
                "sampling_freq_hz": 0.0,
                "os_integration_status": "PRIVATE_PAUSED",
                "changes": ["All input sensors disabled", "AI inference paused"]
            })
            self.mode_config = config
            return config

        # Re-enable adapters if returning from PRIVATE mode
        if old_mode == "PRIVATE":
            camera_adapter.set_enabled(True)
            audio_adapter.set_enabled(True)
            screen_adapter.set_enabled(True)
            activity_adapter.set_enabled(True)

        # 2. DEEP FOCUS MODE
        if new_mode == "DEEP FOCUS":
            camera_adapter.check_interval = 2.5  # Reduced sampling frequency to save CPU/NPU
            audio_adapter.check_interval = 2.0
            
            # Apply Windows OS System Integration
            win_res = windows_integration.apply_deep_focus_changes()
            os_status = win_res.get("label", "WINDOWS INTEGRATION") if win_res.get("supported") else "OS integration unavailable"

            config.update({
                "sampling_freq_hz": 0.4,
                "os_integration_status": os_status,
                "changes": [
                    "AI sampling interval relaxed to 2.5s (reduces CPU/NPU overhead)",
                    "Focus context weight prioritized"
                ] + win_res.get("changes", [])
            })

        # 3. COLLABORATION MODE
        elif new_mode == "COLLABORATION":
            camera_adapter.check_interval = 0.5  # Increased YOLOX sampling frequency for multi-person detection
            audio_adapter.check_interval = 0.5  # Increased YAMNet audio sensitivity
            
            if old_mode == "DEEP FOCUS":
                windows_integration.restore_system_changes()

            config.update({
                "sampling_freq_hz": 2.0,
                "os_integration_status": "ECHODESK MODE",
                "changes": [
                    "YOLOX-Small presence sampling rate increased to 2.0 Hz",
                    "YAMNet audio classification sensitivity boosted"
                ]
            })

        # 4. MEETING MODE
        elif new_mode == "MEETING":
            camera_adapter.check_interval = 1.0
            audio_adapter.check_interval = 0.5  # High audio sampling frequency for speech
            
            if old_mode == "DEEP FOCUS":
                windows_integration.restore_system_changes()

            config.update({
                "sampling_freq_hz": 2.0,
                "os_integration_status": "ECHODESK MODE",
                "changes": [
                    "Meeting application context prioritized",
                    "Audio speech sampling frequency boosted to 2.0 Hz"
                ]
            })

        # 5. BALANCED MODE
        else:
            camera_adapter.check_interval = 1.0
            audio_adapter.check_interval = 1.0

            if old_mode == "DEEP FOCUS":
                windows_integration.restore_system_changes()

            config.update({
                "sampling_freq_hz": 1.0,
                "os_integration_status": "ECHODESK MODE",
                "changes": [
                    "Standard 1.0 Hz sensor sampling frequency",
                    "Normal system resource distribution"
                ]
            })

        self.mode_config = config
        return config

mode_manager = ModeManager()
