export interface BackendSnapshot {
  timestamp: number;
  engineStatus: string;
  backendType: string;
  contextMode: string;
  contextSubtitle: string;
  contextConfidence: number;
  contextSignals: string[];
  inferenceLatency: number;
  signals: any[];
  privacy: {
    privateMode: boolean;
    cameraActive: boolean;
    microphoneActive: boolean;
    screenActive: boolean;
    historyPaused: boolean;
    cloudProcessing: boolean;
    retention: string;
  };
  protectedApps: any[];
  timelineEvents: any[];
  telemetry: {
    cpu: number;
    ram: number;
    gpu: number;
    temp: number;
    battery: number;
    fan: string;
  };
}

const BACKEND_URL = "http://127.0.0.1:8765";

export class BackendBridge {
  private static eventSource: EventSource | null = null;

  public static isElectronAvailable(): boolean {
    return typeof window !== "undefined" && (window as any).echoDeskAPI?.isElectron === true;
  }

  public static async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/status`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static subscribeToUpdates(onData: (snapshot: BackendSnapshot) => void, onError?: () => void) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(`${BACKEND_URL}/api/stream`);
      this.eventSource.onmessage = (event) => {
        try {
          const snapshot: BackendSnapshot = JSON.parse(event.data);
          onData(snapshot);
        } catch (e) {
          console.error("Failed to parse SSE snapshot:", e);
        }
      };

      this.eventSource.onerror = () => {
        if (onError) onError();
        this.disconnect();
      };
    } catch {
      if (onError) onError();
    }
  }

  public static disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public static async togglePrivateMode(enabled?: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/private-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      return data.privateMode;
    } catch {
      return false;
    }
  }

  public static async toggleSensor(sensorId: string, enabled: boolean): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sensor-toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sensorId, enabled })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async addProtectedApp(name: string): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/add-protected-app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      return await res.json();
    } catch {
      return null;
    }
  }

  public static async removeProtectedApp(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/remove-protected-app`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
