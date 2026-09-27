import os
import sys
import json
import urllib.request
import zipfile
import io
import hashlib
import time

# Absolute path to repository root
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(REPO_ROOT, "models")
VISION_DIR = os.path.join(MODELS_DIR, "vision", "yolox")
AUDIO_DIR = os.path.join(MODELS_DIR, "audio", "yamnet")

# Qualcomm AI Hub Official Model Asset Links (v0.63.0)
YOLOX_ZIP_URL = "https://qaihub-public-assets.s3.us-west-2.amazonaws.com/qai-hub-models/models/yolox/releases/v0.63.0/yolox-onnx-float.zip"
YAMNET_ZIP_URL = "https://qaihub-public-assets.s3.us-west-2.amazonaws.com/qai-hub-models/models/yamnet/releases/v0.63.0/yamnet-onnx-float.zip"

def ensure_dependencies():
    """Verify required Python packages are available."""
    missing = []
    try:
        import onnxruntime
    except ImportError:
        missing.append("onnxruntime")
    try:
        import numpy
    except ImportError:
        missing.append("numpy")

    if missing:
        print(f"[ERROR] Missing required dependencies: {', '.join(missing)}")
        print("Please install them via: pip install " + " ".join(missing))
        sys.exit(1)

def detect_supported_runtime():
    """Detect host platform and supported ONNX Runtime execution providers."""
    import platform
    import onnxruntime as ort

    arch = platform.machine().lower()
    sys_platform = sys.platform
    providers = ort.get_available_providers()

    has_qnn = "QNNExecutionProvider" in providers
    has_cuda = "CUDAExecutionProvider" in providers
    has_dml = "DirectMLExecutionProvider" in providers

    if sys_platform == "win32" and ("arm" in arch or "aarch64" in arch) and has_qnn:
        target_runtime = "Qualcomm QNN (NPU)"
        is_snapdragon = True
    elif has_cuda:
        target_runtime = "NVIDIA CUDA (GPU)"
        is_snapdragon = False
    elif has_dml:
        target_runtime = "DirectML (GPU)"
        is_snapdragon = False
    else:
        target_runtime = "CPU (Universal)"
        is_snapdragon = False

    return {
        "platform": sys_platform,
        "architecture": arch,
        "target_runtime": target_runtime,
        "is_snapdragon": is_snapdragon,
        "available_providers": providers
    }

def download_and_extract_model(model_name: str, zip_url: str, target_dir: str, expected_filename: str):
    """Download, verify zip integrity, and extract model artifact."""
    os.makedirs(target_dir, exist_ok=True)
    target_onnx_path = os.path.join(target_dir, expected_filename)

    if os.path.exists(target_onnx_path):
        size_mb = round(os.path.getsize(target_onnx_path) / (1024 * 1024), 2)
        print(f"[OK] {model_name} artifact already present: {target_onnx_path} ({size_mb} MB)")
        return target_onnx_path

    print(f"[DOWNLOAD] Retrieving {model_name} from Qualcomm AI Hub...")
    print(f"           URL: {zip_url}")

    req = urllib.request.Request(zip_url, headers={"User-Agent": "EchoDesk-ModelFetcher/1.0"})
    with urllib.request.urlopen(req) as resp:
        zip_bytes = resp.read()

    # Calculate SHA256 for verification reporting
    sha256_hash = hashlib.sha256(zip_bytes).hexdigest()
    print(f"[VERIFY] {model_name} zip downloaded ({round(len(zip_bytes)/(1024*1024), 2)} MB). SHA256: {sha256_hash[:16]}...")

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
        namelist = z.namelist()
        for member in namelist:
            filename = os.path.basename(member)
            if not filename:
                continue
            # Extract relevant files directly to target_dir
            dest_path = os.path.join(target_dir, filename)
            with z.open(member) as source, open(dest_path, "wb") as target:
                target.write(source.read())

    if os.path.exists(target_onnx_path):
        size_mb = round(os.path.getsize(target_onnx_path) / (1024 * 1024), 2)
        print(f"[SUCCESS] {model_name} installed successfully -> {target_onnx_path} ({size_mb} MB)")
        return target_onnx_path
    else:
        print(f"[ERROR] Extraction finished but {expected_filename} not found in {target_dir}")
        sys.exit(1)

def main():
    print("==================================================")
    print("EchoDesk Model Setup Automation — Qualcomm AI Hub")
    print("==================================================")

    ensure_dependencies()
    info = detect_supported_runtime()

    print(f"Host OS: {info['platform']} ({info['architecture']})")
    print(f"Supported Execution Runtime: {info['target_runtime']}")
    print(f"Available Providers: {', '.join(info['available_providers'])}")
    print("--------------------------------------------------")

    t0 = time.time()
    yolox_path = download_and_extract_model("YOLOX-Small (Vision)", YOLOX_ZIP_URL, VISION_DIR, "yolox.onnx")
    yamnet_path = download_and_extract_model("YAMNet (Audio)", YAMNET_ZIP_URL, AUDIO_DIR, "yamnet.onnx")
    elapsed = round(time.time() - t0, 2)

    print("--------------------------------------------------")
    print("INSTALLED MODEL SUMMARY:")
    print(f"1. YOLOX-Small: {yolox_path} [{round(os.path.getsize(yolox_path)/(1024*1024),2)} MB] (License: Apache-2.0)")
    print(f"2. YAMNet:      {yamnet_path} [{round(os.path.getsize(yamnet_path)/(1024*1024),2)} MB] (License: MIT)")
    print(f"Setup completed in {elapsed}s.")
    print("==================================================")

if __name__ == "__main__":
    main()
