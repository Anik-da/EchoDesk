import unittest
from unittest.mock import patch, MagicMock
import os
import sys

# Ensure python_engine is on sys.path
ENGINE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "python_engine")
if ENGINE_DIR not in sys.path:
    sys.path.insert(0, ENGINE_DIR)

from platform.base import CapabilityState
from platform.windows import WindowsPlatform
from platform.macos import MacOSPlatform
from platform.linux import LinuxPlatform
from hardware.cpu import get_cpu_info
from hardware.memory import get_memory_info
from hardware.gpu import get_gpu_info
from hardware.storage import get_storage_info
from hardware.battery import get_battery_info
from hardware.thermal import get_thermal_info
from ai_runtime.cpu import CPURuntime
from ai_runtime.cuda import CUDARuntime
from ai_runtime.qnn import QNNRuntime
from ai_runtime.coreml import CoreMLRuntime
from sensor.camera import CameraSensor
from sensor.microphone import MicrophoneSensor
from sensor.screen import ScreenSensor
from sensor.activity import ActivitySensor
from system.device_info import DeviceInfoService

class TestPlatformDetection(unittest.TestCase):
    """Test OS and device identity detection across platforms."""

    def test_windows_platform_detection(self):
        adapter = WindowsPlatform()
        info = adapter.get_os_info()
        self.assertEqual(info["os"], "windows")
        self.assertIn("architecture", info)
        ident = adapter.get_device_identity()
        self.assertIn("manufacturer", ident)
        self.assertIn("model", ident)
        self.assertTrue(len(adapter.get_app_data_dir()) > 0)

    def test_macos_platform_detection(self):
        adapter = MacOSPlatform()
        info = adapter.get_os_info()
        self.assertEqual(info["os"], "macos")
        ident = adapter.get_device_identity()
        self.assertEqual(ident["manufacturer"], "Apple")
        self.assertTrue("EchoDesk" in adapter.get_app_data_dir())
        self.assertTrue("Application Support" in adapter.get_app_data_dir())

    def test_linux_platform_detection(self):
        adapter = LinuxPlatform()
        info = adapter.get_os_info()
        self.assertEqual(info["os"], "linux")
        ident = adapter.get_device_identity()
        self.assertIn("manufacturer", ident)
        self.assertTrue("echodesk" in adapter.get_app_data_dir())

class TestHardwareTelemetry(unittest.TestCase):
    """Test CPU, memory, GPU, storage, battery, and thermal telemetry."""

    def test_cpu_detection(self):
        cpu = get_cpu_info()
        self.assertIn("name", cpu)
        self.assertIn("vendor", cpu)
        self.assertIn("cores", cpu)
        self.assertIn("threads", cpu)
        self.assertIn("usage_percent", cpu)
        self.assertGreater(cpu["cores"], 0)
        self.assertGreater(cpu["threads"], 0)

    def test_memory_detection(self):
        mem = get_memory_info()
        self.assertGreater(mem["total_gb"], 0)
        self.assertGreater(mem["used_gb"], 0)
        self.assertGreaterEqual(mem["usage_percent"], 0)

    def test_gpu_detection(self):
        gpus = get_gpu_info()
        self.assertTrue(len(gpus) > 0)
        primary = gpus[0]
        self.assertIn("name", primary)
        self.assertIn("status", primary)

    def test_storage_detection(self):
        drives = get_storage_info()
        self.assertTrue(len(drives) > 0)
        d = drives[0]
        self.assertIn("drive", d)
        self.assertIn("mount", d)
        self.assertGreater(d["total_gb"], 0)

    def test_battery_present_or_absent(self):
        batt = get_battery_info()
        self.assertIn("available", batt)
        if not batt["available"]:
            self.assertIsNone(batt["percent"])
            self.assertIsNone(batt["charging"])
        else:
            self.assertIsInstance(batt["percent"], int)

    def test_thermal_telemetry_never_fabricates(self):
        thermal = get_thermal_info()
        self.assertIn("cpu_c", thermal)
        self.assertIn("gpu_c", thermal)
        self.assertIn("fan_rpm", thermal)
        # If unavailable, it must be None, never a hardcoded number
        if thermal["cpu_c"] is not None:
            self.assertIsInstance(thermal["cpu_c"], int)

class TestAIRuntimeAbstraction(unittest.TestCase):
    """Test AI runtime selection, device types, and Snapdragon conditional policy."""

    def test_cpu_runtime_universal_fallback(self):
        rt = CPURuntime()
        self.assertTrue(rt.is_available())
        self.assertEqual(rt.device_type, "CPU")
        res = rt.benchmark("test context")
        self.assertIn("latency_ms", res)
        self.assertGreater(res["latency_ms"], 0)

    def test_qnn_runtime_rejects_non_qualcomm(self):
        rt = QNNRuntime()
        # On x86 development machine, QNN must NOT be available
        if "arm" not in sys.platform.lower() and "arm" not in os.environ.get("PROCESSOR_ARCHITECTURE", "").lower():
            self.assertFalse(rt.is_available())
            status = rt.get_status()
            self.assertFalse(status["npu_available"])
            self.assertFalse(status["qnn_available"])
            self.assertIn("Not supported", status["reason"])

    def test_cuda_runtime_detection(self):
        rt = CUDARuntime()
        status = rt.get_status()
        self.assertIn("available", status)
        self.assertIn("device_type", status)

    def test_coreml_runtime_platform_check(self):
        rt = CoreMLRuntime()
        if sys.platform != "darwin":
            self.assertFalse(rt.is_available())
            self.assertIn("only supported on macOS", rt.get_status()["reason"])

class TestSensorsAndPrivacy(unittest.TestCase):
    """Test sensor adapters with strict privacy constraints."""

    def test_camera_zero_persistence(self):
        cam = CameraSensor()
        readout = cam.read()
        self.assertIn("sensor", readout)
        self.assertIn("user_present", readout)
        # Verify no image or frame buffer exists in output dictionary
        self.assertNotIn("frame", readout)
        self.assertNotIn("image", readout)
        self.assertNotIn("buffer", readout)

    def test_microphone_zero_audio_recording(self):
        mic = MicrophoneSensor()
        readout = mic.read()
        self.assertIn("sensor", readout)
        self.assertIn("speech_detected", readout)
        # Verify no audio stream exists in output dictionary
        self.assertNotIn("wav", readout)
        self.assertNotIn("audio_data", readout)

    def test_screen_context(self):
        scr = ScreenSensor()
        readout = scr.read()
        self.assertIn("sensor", readout)
        self.assertIn("active_app", readout)
        self.assertIn("category", readout)

    def test_activity_zero_keystroke_capture(self):
        act = ActivitySensor()
        readout = act.read()
        self.assertIn("sensor", readout)
        self.assertIn("activity_level", readout)
        # Verify no keys or text captured
        self.assertNotIn("keys", readout)
        self.assertNotIn("text", readout)
        self.assertNotIn("keystrokes", readout)

class TestDeviceInfoService(unittest.TestCase):
    """Test central DeviceInfoService integration."""

    def test_live_telemetry_schema(self):
        svc = DeviceInfoService()
        svc.set_mode("LIVE")
        telemetry = svc.get_system_telemetry()
        self.assertEqual(telemetry["mode"], "LIVE")
        self.assertIn("cpu", telemetry)
        self.assertIn("memory", telemetry)
        self.assertIn("gpu", telemetry)
        self.assertIn("storage", telemetry)
        self.assertIn("battery", telemetry)
        self.assertIn("thermal", telemetry)
        self.assertIn("ai_runtime", telemetry)
        self.assertIn("capabilities", telemetry)

    def test_simulation_mode_separation(self):
        svc = DeviceInfoService()
        svc.set_mode("SIMULATION")
        sim_data = svc.get_system_telemetry()
        self.assertEqual(sim_data["mode"], "SIMULATION")
        self.assertIn("Simulated", sim_data["cpu"]["name"])

        # Switch back to LIVE
        svc.set_mode("LIVE")
        live_data = svc.get_system_telemetry()
        self.assertEqual(live_data["mode"], "LIVE")
        self.assertNotIn("Simulated", live_data["cpu"]["name"])

if __name__ == "__main__":
    unittest.main()
