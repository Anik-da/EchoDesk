import type { DeviceSystemInfo } from "@/types";

export interface BackendSnapshot {
  timestamp: number;
  engineStatus: string;
  backendType: string;
  telemetryMode?: string;
  simulationMode?: boolean;
  contextMode: string;
  contextSubtitle: string;
  contextConfidence: number;
  contextSignals: string[];
  inferenceLatency: number | null;
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
  events?: any[];
  system?: DeviceSystemInfo;
  telemetry: {
    cpu: number | null;
    cpuName?: string;
    cpuCores?: number;
    cpuThreads?: number;
    gpu: number | null;
    ram: number;
    ramUsed: number;
    ramTotal: number;
    ramPercent?: number;
    storageUsed: number | null;
    storageTotal: number | null;
    storagePercent?: number | null;
    temp: number | null;
    cpuTemp: number | null;
    gpuTemp: number | null;
    cpuFanRpm: number | null;
    gpuFanRpm: number | null;
    battery: number | null;
    powerConnected: boolean;
    powerState?: string;
    npuAvailable?: boolean;
    qnnAvailable?: boolean;
    aiProvider?: string;
    telemetryMode?: string;
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

  private static reconnectTimer: any = null;

  public static subscribeToUpdates(onData: (snapshot: BackendSnapshot) => void, onError?: () => void) {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const connect = () => {
      try {
        const es = new EventSource(`${BACKEND_URL}/api/stream`);
        this.eventSource = es;

        es.onmessage = (event) => {
          try {
            const snapshot: BackendSnapshot = JSON.parse(event.data);
            onData(snapshot);
          } catch (e) {
            console.error("Failed to parse SSE snapshot:", e);
          }
        };

        es.onerror = () => {
          if (onError) onError();
          if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
          }
          // Automatically retry connecting every 2 seconds until Python engine is reachable
          if (!this.reconnectTimer) {
            this.reconnectTimer = setTimeout(() => {
              this.reconnectTimer = null;
              connect();
            }, 2000);
          }
        };
      } catch {
        if (onError) onError();
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            connect();
          }, 2000);
        }
      }
    };

    connect();
  }

  public static disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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

  public static async getSystemInfo(): Promise<DeviceSystemInfo | null> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/system`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  public static async setTelemetryMode(mode: "LIVE" | "SIMULATION"): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/telemetry-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
