import sys
import psutil

def get_storage_info() -> list:
    """Returns detected physical/virtual mounted storage partitions and actual usage."""
    drives = []
    try:
        parts = psutil.disk_partitions(all=False)
        seen_mounts = set()
        for p in parts:
            # Skip read-only, loop, or virtual pseudo filesystems
            if p.mountpoint in seen_mounts:
                continue
            if "cdrom" in p.opts or "removable" in p.opts and not p.fstype:
                continue
            if p.fstype.lower() in ("squashfs", "tmpfs", "devtmpfs", "overlay"):
                continue

            try:
                usage = psutil.disk_usage(p.mountpoint)
                total_gb = round(usage.total / (1024 ** 3), 1)
                used_gb = round(usage.used / (1024 ** 3), 1)
                free_gb = round(usage.free / (1024 ** 3), 1)
                percent = round(usage.percent, 1)

                drive_name = p.device
                if sys.platform == "win32":
                    drive_name = f"Drive {p.mountpoint.rstrip(r'\\')}"
                elif sys.platform == "darwin":
                    drive_name = "Macintosh HD" if p.mountpoint == "/" or "Data" in p.mountpoint else p.mountpoint
                else:
                    drive_name = "Root Volume (/)" if p.mountpoint == "/" else p.mountpoint

                drives.append({
                    "drive": drive_name,
                    "mount": p.mountpoint,
                    "filesystem": p.fstype,
                    "total_gb": total_gb,
                    "used_gb": used_gb,
                    "free_gb": free_gb,
                    "usage_percent": percent
                })
                seen_mounts.add(p.mountpoint)
            except (PermissionError, OSError):
                continue
    except Exception:
        pass

    if not drives:
        try:
            usage = psutil.disk_usage("/")
            drives.append({
                "drive": "Primary Storage",
                "mount": "/",
                "filesystem": "Standard",
                "total_gb": round(usage.total / (1024 ** 3), 1),
                "used_gb": round(usage.used / (1024 ** 3), 1),
                "free_gb": round(usage.free / (1024 ** 3), 1),
                "usage_percent": round(usage.percent, 1)
            })
        except Exception:
            pass

    return drives
