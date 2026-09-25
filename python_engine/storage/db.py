import sqlite3
import os
import json
import time

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "echodesk.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS protected_apps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        protected INTEGER NOT NULL DEFAULT 1
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS timeline_events (
        id TEXT PRIMARY KEY,
        timestamp REAL NOT NULL,
        time_str TEXT NOT NULL,
        hour INTEGER NOT NULL,
        minute INTEGER NOT NULL,
        context TEXT NOT NULL,
        duration INTEGER NOT NULL,
        confidence INTEGER NOT NULL,
        signals TEXT NOT NULL,
        explanation TEXT NOT NULL,
        raw_payload TEXT
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # Populate default protected apps if empty
    cursor.execute("SELECT COUNT(*) FROM protected_apps")
    if cursor.fetchone()[0] == 0:
        default_apps = [
            ("app1", "1Password", "KeyRound", 1),
            ("app2", "Chrome (Incognito)", "Globe", 1),
            ("app3", "Signal Desktop", "MessageSquare", 1),
            ("app4", "Banking & Finance", "Landmark", 1)
        ]
        cursor.executemany("INSERT INTO protected_apps VALUES (?, ?, ?, ?)", default_apps)

    # Populate default timeline if empty
    cursor.execute("SELECT COUNT(*) FROM timeline_events")
    if cursor.fetchone()[0] == 0:
        now = time.time()
        default_timeline = [
            ("evt-1", now - 7200, "09:15", 9, 15, "DEEP FOCUS", 45, 94, json.dumps(["VS Code Active", "High Typing Density", "Camera: User Present"]), "Sustained single-window coding activity with low ambient noise and continuous keyboard input.", json.dumps({"cpu": 18.4, "ram": 42.1})),
            ("evt-2", now - 4500, "10:00", 10, 0, "MEETING", 30, 88, json.dumps(["Zoom Active", "Microphone: Speech Detected", "Camera: Face Tracked"]), "Active speech input matched with Zoom application process running.", json.dumps({"cpu": 24.2, "ram": 48.5})),
            ("evt-3", now - 2700, "10:30", 10, 30, "COLLABORATION", 35, 91, json.dumps(["Slack Active", "Browser Docs Open", "Intermittent Audio"]), "Dual-window workflow across communication and document applications.", json.dumps({"cpu": 19.1, "ram": 44.0})),
            ("evt-4", now - 900, "11:05", 11, 5, "BREAK", 15, 82, json.dumps(["System Idle", "No Keyboard Activity", "Camera: Away"]), "No keyboard/mouse activity detected for over 10 minutes.", json.dumps({"cpu": 6.2, "ram": 38.1}))
        ]
        cursor.executemany("INSERT INTO timeline_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", default_timeline)

    conn.commit()
    conn.close()

def get_protected_apps():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM protected_apps")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r["id"], "name": r["name"], "icon": r["icon"], "protected": bool(r["protected"])} for r in rows]

def add_protected_app(name, icon="Shield"):
    app_id = f"app_{int(time.time()*1000)}"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO protected_apps VALUES (?, ?, ?, 1)", (app_id, name, icon))
    conn.commit()
    conn.close()
    return {"id": app_id, "name": name, "icon": icon, "protected": True}

def remove_protected_app(app_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM protected_apps WHERE id = ?", (app_id,))
    conn.commit()
    conn.close()

def get_timeline_events():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM timeline_events ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    events = []
    for r in rows:
        events.append({
            "id": r["id"],
            "timestamp": r["timestamp"],
            "time": r["time_str"],
            "hour": r["hour"],
            "minute": r["minute"],
            "context": r["context"],
            "duration": r["duration"],
            "confidence": r["confidence"],
            "signals": json.loads(r["signals"]),
            "explanation": r["explanation"],
            "rawPayload": json.loads(r["raw_payload"]) if r["raw_payload"] else {}
        })
    return events

def log_timeline_event(context, duration, confidence, signals, explanation, raw_payload=None):
    evt_id = f"evt_{int(time.time()*1000)}"
    now = time.time()
    time_str = time.strftime("%H:%M", time.localtime(now))
    hour = int(time.strftime("%H", time.localtime(now)))
    minute = int(time.strftime("%M", time.localtime(now)))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO timeline_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (evt_id, now, time_str, hour, minute, context, duration, confidence, json.dumps(signals), explanation, json.dumps(raw_payload or {})))
    conn.commit()
    conn.close()
