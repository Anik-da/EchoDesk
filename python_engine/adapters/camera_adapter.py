import time
import gc
from adapters.base_adapter import BaseSensorAdapter
from engine.ai_model_abstraction import VisionModel

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

class CameraAdapter(BaseSensorAdapter):
    """Camera sensor adapter powered by YOLOX-Small local ONNX object detection."""

    def __init__(self):
        super().__init__(sensor_id="camera", sensor_type="camera", label="Vision (YOLOX-Small)")
        self.last_check_time = 0
        self.check_interval = 1.0  # Rate-limited to 1 Hz sampling
        self.cached_result = None

        self.vision_model = VisionModel()
        self.vision_loaded = self.vision_model.load()

    def is_available(self) -> bool:
        if not OPENCV_AVAILABLE:
            return False
        try:
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW) if hasattr(cv2, 'CAP_DSHOW') else cv2.VideoCapture(0)
            if cap and cap.isOpened():
                cap.release()
                return True
            return False
        except Exception:
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
                "semantic_outputs": ["USER_AWAY"],
                "description": "Camera sensor disabled by user",
                "confidence": 0.0,
                "latency_ms": 0.0,
                "provider": self.vision_model.provider(),
                "model": "YOLOX-Small"
            }

        now = time.time()
        if self.cached_result and (now - self.last_check_time < self.check_interval):
            return self.cached_result

        self.last_check_time = now

        if not OPENCV_AVAILABLE:
            self.cached_result = {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": True,
                "available": False,
                "state": "unavailable",
                "activityLevel": 0,
                "semantic_outputs": ["NO_PERSON"],
                "description": "OpenCV library unavailable on host",
                "confidence": 0.0,
                "latency_ms": 0.0,
                "provider": self.vision_model.provider(),
                "model": "YOLOX-Small"
            }
            return self.cached_result

        try:
            cap = cv2.VideoCapture(0, cv2.CAP_DSHOW) if hasattr(cv2, 'CAP_DSHOW') else cv2.VideoCapture(0)
            if not cap or not cap.isOpened():
                if cap:
                    cap.release()
                self.cached_result = {
                    "id": self.sensor_id,
                    "label": self.label,
                    "enabled": True,
                    "available": False,
                    "state": "unavailable",
                    "activityLevel": 0,
                    "semantic_outputs": ["NO_PERSON"],
                    "description": "Camera device unavailable or in use by another app",
                    "confidence": 0.0,
                    "latency_ms": 0.0,
                    "provider": self.vision_model.provider(),
                    "model": "YOLOX-Small"
                }
                return self.cached_result

            ret, frame = cap.read()
            cap.release()

            if not ret or frame is None:
                self.cached_result = {
                    "id": self.sensor_id,
                    "label": self.label,
                    "enabled": True,
                    "available": True,
                    "state": "low",
                    "activityLevel": 0,
                    "semantic_outputs": ["USER_AWAY"],
                    "description": "Blank camera frame captured",
                    "confidence": 0.0,
                    "latency_ms": 0.0,
                    "provider": self.vision_model.provider(),
                    "model": "YOLOX-Small"
                }
                return self.cached_result

            # Run real YOLOX-Small local inference
            v_res = self.vision_model.infer({"frame": frame})

            # CRITICAL PRIVACY: Immediately release raw frame memory
            del frame
            gc.collect()

            person_count = v_res.get("person_count", 0)
            user_present = v_res.get("user_present", False)
            conf = v_res.get("confidence", 0.0)
            lat = v_res.get("latency_ms", 0.0)
            prov = v_res.get("provider", self.vision_model.provider())

            if user_present:
                state = "active"
                act_lvl = max(60, int(conf * 100))
                desc = f"YOLOX-Small: {person_count} person detected ({conf*100:.0f}% conf, {lat}ms)"
            else:
                state = "low"
                act_lvl = 0
                desc = f"YOLOX-Small: No person detected ({lat}ms)"

            self.cached_result = {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": True,
                "available": True,
                "state": state,
                "activityLevel": act_lvl,
                "semantic_outputs": v_res.get("semantic_outputs", ["NO_PERSON"]),
                "description": desc,
                "confidence": conf,
                "latency_ms": lat,
                "provider": prov,
                "model": "YOLOX-Small",
                "raw_released": True
            }
            return self.cached_result

        except Exception as e:
            self.cached_result = {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": True,
                "available": False,
                "state": "unavailable",
                "activityLevel": 0,
                "semantic_outputs": ["NO_PERSON"],
                "description": f"Camera sensor error: {str(e)[:40]}",
                "confidence": 0.0,
                "latency_ms": 0.0,
                "provider": self.vision_model.provider(),
                "model": "YOLOX-Small"
            }
            return self.cached_result
