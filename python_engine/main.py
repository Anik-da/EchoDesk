import http.server
import socketserver
import json
import time
import sys
import os

# Add directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from engine.context_engine import ContextEngine

PORT = 8765
engine = ContextEngine()

class EchoDeskHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/status":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            snapshot = engine.get_telemetry_snapshot()
            self.wfile.write(json.dumps(snapshot).encode("utf-8"))
        elif self.path == "/api/system":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            snapshot = engine.get_telemetry_snapshot()
            self.wfile.write(json.dumps(snapshot.get("system", {})).encode("utf-8"))
        elif self.path == "/api/stream":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self._send_cors_headers()
            self.end_headers()

            try:
                while True:
                    snapshot = engine.get_telemetry_snapshot()
                    data_str = f"data: {json.dumps(snapshot)}\n\n"
                    self.wfile.write(data_str.encode("utf-8"))
                    self.wfile.flush()
                    time.sleep(1.0)
            except Exception:
                pass
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)
        payload = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}

        if self.path == "/api/private-mode":
            enabled = payload.get("enabled", not engine.privacy_engine.private_mode)
            engine.privacy_engine.set_private_mode(enabled)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "privateMode": engine.privacy_engine.private_mode}).encode("utf-8"))

        elif self.path == "/api/sensor-toggle":
            sensor_id = payload.get("sensorId")
            enabled = payload.get("enabled", True)
            engine.set_sensor_toggle(sensor_id, enabled)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))

        elif self.path == "/api/telemetry-mode":
            mode = payload.get("mode", "LIVE")
            engine.set_telemetry_mode(mode)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "telemetryMode": engine.telemetry_mode}).encode("utf-8"))

        elif self.path == "/api/simulation-mode":
            enabled = payload.get("enabled", True)
            engine.set_simulation_mode(enabled)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "simulationMode": enabled, "telemetryMode": engine.telemetry_mode}).encode("utf-8"))

        elif self.path == "/api/scenario":
            scenario = payload.get("scenario", "Deep Coding Session")
            engine.set_scenario(scenario)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "scenario": scenario}).encode("utf-8"))

        elif self.path == "/api/add-protected-app":
            name = payload.get("name", "New App")
            from storage.db import add_protected_app
            created = add_protected_app(name)
            engine.privacy_engine.set_protected_apps(engine.get_telemetry_snapshot()["protectedApps"])
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps(created).encode("utf-8"))

        elif self.path == "/api/remove-protected-app":
            app_id = payload.get("id")
            from storage.db import remove_protected_app
            if app_id:
                remove_protected_app(app_id)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))

        elif self.path == "/api/clear-history":
            from storage.db import clear_all_history
            clear_all_history()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode("utf-8"))

        elif self.path == "/api/set-retention":
            period = payload.get("retention", "30 days")
            from storage.db import cleanup_retention_history
            deleted = cleanup_retention_history(period)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self._send_cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "deletedCount": deleted}).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

def run():
    from system.device_info import device_service
    info = device_service.get_static_info()
    dyn = device_service.get_dynamic_telemetry()
    gpu_desc = ", ".join([g["name"] for g in info["gpus"]])
    npu_state = "Active" if info["npu_info"]["npu_available"] else "Not detected"
    qnn_state = "Available" if info["npu_info"]["qnn_available"] else "Not available"

    print("==================================================")
    print("EchoDesk hardware detection")
    print(f"Manufacturer: {info['manufacturer']}")
    print(f"Model: {info['model']}")
    print(f"CPU: {info['cpu_name']}")
    print(f"GPU: {gpu_desc}")
    print(f"RAM: {dyn['memory']['total_gb']} GB")
    print(f"OS: {info['os']}")
    print(f"Architecture: {info['architecture']}")
    print(f"NPU: {npu_state}")
    print(f"QNN: {qnn_state}")
    print(f"Runtime: {info['npu_info']['provider']}")
    print("Default Mode: LIVE HARDWARE")
    print("==================================================")
    print(f"[EchoDesk Engine] Python Background Service listening on http://127.0.0.1:{PORT}")
    socketserver.TCPServer.allow_reuse_address = True
    server = socketserver.TCPServer(("127.0.0.1", PORT), EchoDeskHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("[EchoDesk Engine] Shutting down service...")
        server.server_close()

if __name__ == "__main__":
    run()
