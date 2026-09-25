import time
import gc
from adapters.base_adapter import BaseSensorAdapter

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

class CameraAdapter(BaseSensorAdapter):
    def __init__(self):
        super().__init__(sensor_id="camera", sensor_type="camera", label="Camera Sensor")
        self.cap = None
        self.face_cascade = None
        self.last_check_time = 0
        self.check_interval = 1.0  # Controlled 1 Hz sampling rate
        self.cached_result = None

        if OPENCV_AVAILABLE:
            try:
                # Load OpenCV Haar cascade for face detection
                cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception as e:
                self.error_message = f"Haar cascade load error: {e}"

    def is_available(self) -> bool:
        if not OPENCV_AVAILABLE:
            return False
        try:
            # Quick probe
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
                "description": "Camera sensor disabled by user"
            }

        now = time.time()
        # Rate limiting: sample max once per check_interval
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
                "description": "OpenCV library unavailable on host"
            }
            return self.cached_result

        try:
            # Capture single frame
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
                    "description": "Camera hardware device unavailable or in use"
                }
                return self.cached_result

            ret, frame = cap.read()
            cap.release()  # Immediately release camera device

            if not ret or frame is None:
                self.cached_result = {
                    "id": self.sensor_id,
                    "label": self.label,
                    "enabled": True,
                    "available": True,
                    "state": "low",
                    "activityLevel": 0,
                    "semantic_outputs": ["USER_AWAY"],
                    "description": "Blank camera frame captured"
                }
                return self.cached_result

            # Process frame for presence detection
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Detect faces if cascade loaded
            faces = []
            if self.face_cascade and not self.face_cascade.empty():
                faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=4, minSize=(30, 30))

            num_faces = len(faces)

            # Determine semantic outputs
            if num_faces == 1:
                semantics = ["PERSON_PRESENT"]
                activity_level = 85
                desc = "User present (1 face detected on-device)"
                state = "active"
            elif num_faces > 1:
                semantics = ["PERSON_PRESENT", "MULTIPLE_PEOPLE"]
                activity_level = 95
                desc = f"Multiple people present ({num_faces} faces detected)"
                state = "active"
            else:
                # Fallback to mean luminance / motion check if no face cascade match
                mean_lum = gray.mean()
                if mean_lum > 15:  # Non-black frame indicates user likely present at desk
                    semantics = ["PERSON_PRESENT"]
                    activity_level = 60
                    desc = "User present (desk presence detected)"
                    state = "active"
                else:
                    semantics = ["USER_AWAY", "NO_PERSON"]
                    activity_level = 0
                    desc = "No user detected"
                    state = "low"

            # CRITICAL PRIVACY: Immediately release raw frame memory buffers
            del frame
            del gray
            gc.collect()

            self.cached_result = {
                "id": self.sensor_id,
                "label": self.label,
                "enabled": True,
                "available": True,
                "state": state,
                "activityLevel": activity_level,
                "semantic_outputs": semantics,
                "description": desc,
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
                "description": f"Camera sensor error: {str(e)[:40]}"
            }
            return self.cached_result
