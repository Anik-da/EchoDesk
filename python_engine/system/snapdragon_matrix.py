"""
Qualcomm Snapdragon Chipset Compatibility Matrix & Runtime Mapping for EchoDesk.

TARGET CHIP MATRIX:
- Snapdragon X Elite
- Snapdragon X Plus 8-Core
- Snapdragon X2 Elite

Provides configurable model compatibility mapping and hardware runtime verification.
"""

SNAPDRAGON_TARGET_MATRIX = {
    "Snapdragon X Elite": {
        "chipset_id": "SNAPDRAGON_X_ELITE",
        "yolox_compatible": True,
        "yamnet_compatible": True,
        "qnn_htp_supported": True,
        "status": "Supported / Not verified on current host",
        "verified": False
    },
    "Snapdragon X Plus 8-Core": {
        "chipset_id": "SNAPDRAGON_X_PLUS_8_CORE",
        "yolox_compatible": True,
        "yamnet_compatible": True,
        "qnn_htp_supported": True,
        "status": "Supported / Not verified on current host",
        "verified": False
    },
    "Snapdragon X2 Elite": {
        "chipset_id": "SNAPDRAGON_X2_ELITE",
        "yolox_compatible": True,
        "yamnet_compatible": True,
        "qnn_htp_supported": True,
        "status": "Supported / Not verified on current host",
        "verified": False
    }
}

def identify_snapdragon_chipset(cpu_name: str, vendor: str, architecture: str) -> dict:
    """Identifies Qualcomm Snapdragon chipset if present and returns model compatibility status."""
    lower_cpu = cpu_name.lower()
    is_qualcomm = vendor == "Qualcomm" or "snapdragon" in lower_cpu or "sc8" in lower_cpu or "x elite" in lower_cpu

    if not is_qualcomm:
        return {
            "is_snapdragon": False,
            "chipset_name": None,
            "chipset_info": None,
            "message": "Host is not a Qualcomm Snapdragon device"
        }

    # Match target chipset
    chipset_name = "Snapdragon X Elite"  # Default ARM64 Snapdragon assumption
    if "x2" in lower_cpu or "x2 elite" in lower_cpu:
        chipset_name = "Snapdragon X2 Elite"
    elif "x plus" in lower_cpu or "8-core" in lower_cpu or "x1p4" in lower_cpu:
        chipset_name = "Snapdragon X Plus 8-Core"
    elif "x elite" in lower_cpu or "x1e8" in lower_cpu:
        chipset_name = "Snapdragon X Elite"

    target_info = SNAPDRAGON_TARGET_MATRIX.get(chipset_name, SNAPDRAGON_TARGET_MATRIX["Snapdragon X Elite"])

    return {
        "is_snapdragon": True,
        "chipset_name": chipset_name,
        "chipset_info": target_info,
        "message": f"Qualcomm {chipset_name} detected"
    }
