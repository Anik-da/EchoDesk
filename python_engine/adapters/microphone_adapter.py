import time
import math
import gc
import numpy as np
from adapters.base_adapter import BaseSensorAdapter
from engine.ai_model_abstraction import AudioModel

AUDIO_LIB = None
try:
    import sounddevice as sd
    AUDIO_LIB = "sounddevice"
except ImportError:
    try:
        import pyaudio
        AUDIO_LIB = "pyaudio"
    except ImportError:
        AUDIO_LIB = None

class MicrophoneAdapter(BaseSensorAdapter):
    """Microphone sensor adapter powered by YAMNet local ONNX audio event classification."""

    def __init__(self):
        super().__init__(sensor_id="microphone", sensor_type="microphone", label="Audio (YAMNet)")
        self.audio_lib = AUDIO_LIB
        self.last_check_time = 0
        self.check_interval = 1.0  # 1 Hz sampling
        self.cached_result = None

        self.audio_model = AudioModel()
        self.audio_loaded = self.audio_model.load()

    def is_available(self) -> bool:
        if self.audio_lib == "sounddevice":
            try:
                devices = sd.query_devices()
                input_devs = [d for d in devices if d.get("max_input_channels", 0) > 0]
                return len(input_devs) > 0
            except Exception:
                return False
        return False

    def read(self) -> dict:
        if not self.enabled:
            return {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": False,
                "available": True,
                "state": "off",
                "activityLevel": 0,
                "semantic_outputs": ["SILENCE"],
                "description": "Microphone sensor disabled by user",
                "confidence": 0.0,
                "latency_ms": 0.0,
                "provider": self.audio_model.provider(),
                "model": "YAMNet"
            }

        now = time.time()
        if self.cached_result and (now - self.last_check_time < self.check_interval):
            return self.cached_result

        self.last_check_time = now

        if self.audio_lib == "sounddevice":
            try:
                duration = 0.975  # YAMNet standard window duration (15600 samples @ 16kHz)
                sample_rate = 16000
                recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
                sd.wait()

                if recording is not None and len(recording) > 0:
                    pcm_data = recording.flatten()
                    
                    # Run real YAMNet audio classification
                    a_res = self.audio_model.infer({"audio_pcm": pcm_data})

                    # CRITICAL PRIVACY: Immediately release raw audio PCM buffer
                    del recording
                    del pcm_data
                    gc.collect()

                    top_label = a_res.get("top_label", "Silence")
                    conf = a_res.get("confidence", 0.0)
                    lat = a_res.get("latency_ms", 0.0)
                    prov = a_res.get("provider", self.audio_model.provider())
                    semantics = a_res.get("semantic_outputs", ["SILENCE"])

                    is_speech = "SPEECH_ACTIVITY" in semantics or "SPEECH_DETECTED" in semantics
                    state = "active" if (is_speech or conf > 0.3) else "low"
                    act_lvl = min(100, max(0, int(abs(conf) * 100)))

                    desc = f"YAMNet: {top_label} ({lat}ms)"

                    self.cached_result = {
                        "id": self.sensor_id,
                        "label": self.label,
                        "enabled": True,
                        "available": True,
                        "state": state,
                        "activityLevel": act_lvl,
                        "semantic_outputs": semantics,
                        "description": desc,
                        "confidence": conf,
                        "latency_ms": lat,
                        "provider": prov,
                        "model": "YAMNet",
                        "raw_released": True
                    }
                    return self.cached_result
            except Exception as e:
                pass

        self.cached_result = {
            "id": self.sensor_id,
            "label": self.label,
            "enabled": True,
            "available": False,
            "state": "unavailable",
            "activityLevel": 0,
            "semantic_outputs": ["SILENCE"],
            "description": "Microphone unavailable or permission required",
            "confidence": 0.0,
            "latency_ms": 0.0,
            "provider": self.audio_model.provider(),
            "model": "YAMNet",
            "raw_released": True
        }
        return self.cached_result
