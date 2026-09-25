// ===== EchoDesk Type Definitions =====
// Clean interfaces designed so mock services can later be replaced with real implementations.

export type ContextState =
  | "FOCUS"
  | "MEETING"
  | "COLLABORATION"
  | "BREAK"
  | "AWAY"
  | "PRIVATE"
  | "PAUSED"
  | "CONVERSATION"
  | "RESEARCH"
  | "CODING";

export type ContextMode = "DEEP FOCUS" | "BALANCED" | "COLLABORATION" | "MEETING" | "PRIVATE";

export type SamplingMode = "LOW POWER" | "BALANCED" | "REAL-TIME";

export type SensorType = "camera" | "microphone" | "screen" | "activity";

export type SignalState = "active" | "low" | "idle" | "off";

export interface SensorSignal {
  id: SensorType;
  label: string;
  icon: string;
  state: SignalState;
  description: string;
  enabled: boolean;
  activityLevel: number; // 0-100
}

export interface SemanticEvent {
  id: string;
  label: string;
  source: SensorType;
  detected: boolean;
  confidence: number;
}

export interface SystemStatus {
  cpu: number | null;
  cpuName?: string;
  cpuCores?: number;
  cpuThreads?: number;
  gpu: number | null;
  gpuName?: string;
  ramUsed: number;
  ramTotal: number;
  ramPercent?: number;
  storageUsed: number | null;
  storageTotal: number | null;
  storagePercent?: number | null;
  battery: number | null;
  powerConnected: boolean;
  powerState?: string;
  cpuFanRpm: number | null;
  gpuFanRpm: number | null;
  cpuTemp: number | null;
  gpuTemp: number | null;
}

export interface AIRuntime {
  accelerator: "NPU" | "CPU" | "CUDA" | "DirectML";
  status: "ACTIVE" | "IDLE" | "FALLBACK" | "NOT DETECTED";
  inferenceLatency: number | null;
  cpuOverhead: number;
  memory: number;
  cloudRequests: number;
  modelCount: number;
  cloudEnabled: boolean;
  npuAvailable?: boolean;
  qnnAvailable?: boolean;
  provider?: string;
}

export interface DeviceSystemInfo {
  mode: "LIVE" | "SIMULATION";
  manufacturer: string;
  model: string;
  os: string;
  os_name?: string;
  os_version?: string;
  architecture: string;
  platform_string?: string;
  cpu: {
    name: string;
    vendor?: string;
    architecture?: string;
    cores: number;
    threads: number;
    usage_percent: number;
  };
  memory: {
    total_gb: number;
    used_gb: number;
    available_gb: number;
    usage_percent: number;
  };
  gpu: Array<{
    name: string;
    driver?: string;
    usage_percent: number | null;
    temperature_c: number | null;
    memory_used_mb: number | null;
    memory_total_mb: number | null;
    status: string;
  }>;
  storage: Array<{
    device?: string;
    mountpoint?: string;
    drive?: string;
    mount?: string;
    filesystem?: string;
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_percent: number;
  }>;
  battery: {
    available: boolean;
    percent: number | null;
    charging: boolean | null;
    power_plugged: boolean;
    power_state: string;
    seconds_left?: number | null;
    status?: string;
  };
  thermal: {
    cpu_c: number | null;
    gpu_c: number | null;
    fan_rpm: number | null;
    cpu_fan_rpm: number | null;
    gpu_fan_rpm: number | null;
  };
  ai_runtime: {
    provider: string;
    device_type?: string;
    available?: boolean;
    supported?: boolean;
    npu_available: boolean;
    qnn_available: boolean;
    reason?: string | null;
    inference_latency_ms: number | null;
  };
  capabilities?: Record<string, string>;
}

export interface AIModel {
  id: string;
  name: string;
  status: "loaded" | "idle" | "loading";
  runtime: "NPU" | "CPU";
  latency: number;
  memory: number;
  state: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  hour: number;
  minute: number;
  context: ContextState;
  duration: number; // minutes
  confidence: number;
  signals: string[];
  explanation: string;
}

export interface ProtectedApp {
  id: string;
  name: string;
  icon: string;
  protected: boolean;
}

export type RetentionPeriod = "1 day" | "7 days" | "30 days" | "Never";

export interface PrivacyState {
  privateMode: boolean;
  cameraActive: boolean;
  microphoneActive: boolean;
  screenActive: boolean;
  cloudProcessing: boolean;
  rawVideoStored: boolean;
  rawAudioStored: boolean;
  historyPaused: boolean;
  retention: RetentionPeriod;
}

export interface BackgroundStatus {
  running: boolean;
  camera: SignalState;
  microphone: SignalState;
  screen: SignalState;
  cloud: boolean;
}

export interface PrivacyPipelineStep {
  id: string;
  input: string;
  output: string;
  discard: string;
}
