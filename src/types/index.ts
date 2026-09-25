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
  cpu: number;
  gpu: number;
  ramUsed: number;
  ramTotal: number;
  storageUsed: number;
  storageTotal: number;
  battery: number;
  powerConnected: boolean;
  cpuFanRpm: number;
  gpuFanRpm: number;
  cpuTemp: number;
  gpuTemp: number;
}

export interface AIRuntime {
  accelerator: "NPU" | "CPU";
  status: "ACTIVE" | "IDLE" | "FALLBACK";
  inferenceLatency: number;
  cpuOverhead: number;
  memory: number;
  cloudRequests: number;
  modelCount: number;
  cloudEnabled: boolean;
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
