class PrivacyEngine:
    def __init__(self):
        self.private_mode = False
        self.protected_app_names = ["1Password", "Chrome (Incognito)", "Signal Desktop", "Banking & Finance"]

    def set_private_mode(self, enabled: bool):
        self.private_mode = enabled

    def set_protected_apps(self, apps_list):
        self.protected_app_names = [a["name"] if isinstance(a, dict) else a for a in apps_list if (a.get("protected", True) if isinstance(a, dict) else True)]

    def process_signals(self, signals, active_app, window_title):
        is_protected = any(p.lower() in active_app.lower() or p.lower() in window_title.lower() for p in self.protected_app_names)
        
        # If Private Mode is ON or protected app is in foreground
        if self.private_mode or is_protected:
            sanitized_signals = []
            for s in signals:
                s_copy = dict(s)
                s_copy["enabled"] = False
                s_copy["state"] = "off"
                s_copy["activityLevel"] = 0
                s_copy["description"] = "PAUSED BY PRIVACY ENGINE"
                sanitized_signals.append(s_copy)

            return {
                "private_mode_active": True,
                "reason": "PRIVATE MODE ENABLED" if self.private_mode else f"PROTECTED APP IN FOREGROUND ({active_app})",
                "sanitized_app": "[PROTECTED]",
                "sanitized_title": "[REDACTED BY PRIVACY ENGINE]",
                "signals": sanitized_signals,
                "context_override": "PRIVATE" if self.private_mode else "DEEP FOCUS"
            }

        return {
            "private_mode_active": False,
            "reason": None,
            "sanitized_app": active_app,
            "sanitized_title": window_title,
            "signals": signals,
            "context_override": None
        }
