import type {
  SensorSignal,
  SemanticEvent,
  SystemStatus,
  AIRuntime,
  AIModel,
  TimelineEvent,
  ProtectedApp,
  PrivacyState,
  PrivacyPipelineStep,
  BackgroundStatus,
} from "@/types";

export const modeContextMap: Record<string, { context: string; subtitle: string; confidence: number; signals: string[] }> = {
  "DEEP FOCUS": { context: "FOCUS", subtitle: "Deep work detected", confidence: 89, signals: ["VS Code active", "User present", "Quiet environment", "Keyboard activity"] },
  "BALANCED": { context: "FOCUS", subtitle: "General work session", confidence: 72, signals: ["Mixed applications", "User present", "Moderate activity", "Low audio"] },
  "COLLABORATION": { context: "COLLABORATION", subtitle: "Team collaboration detected", confidence: 81, signals: ["Screen sharing", "User present", "Speech detected", "Active typing"] },
  "MEETING": { context: "MEETING", subtitle: "Meeting in progress", confidence: 85, signals: ["Video call active", "Speech detected", "User present", "Screen active"] },
  "PRIVATE": { context: "PRIVATE", subtitle: "Privacy mode active", confidence: 0, signals: ["Sensing paused", "All sensors off", "Local only", "No data stored"] },
};

export const initialSignals: SensorSignal[] = [
  { id: "camera", label: "Vision", icon: "Camera", state: "active", description: "User present", enabled: true, activityLevel: 65 },
  { id: "microphone", label: "Audio", icon: "Mic", state: "low", description: "Low activity", enabled: true, activityLevel: 22 },
  { id: "screen", label: "Screen", icon: "Monitor", state: "active", description: "VS Code active", enabled: true, activityLevel: 78 },
  { id: "activity", label: "Activity", icon: "Keyboard", state: "active", description: "Keyboard active", enabled: true, activityLevel: 54 },
];

export const initialEvents: SemanticEvent[] = [
  { id: "person", label: "Person Present", source: "camera", detected: true, confidence: 94 },
  { id: "speech", label: "Speech Detected", source: "microphone", detected: false, confidence: 12 },
  { id: "typing", label: "Typing Activity", source: "activity", detected: true, confidence: 88 },
  { id: "vscode", label: "VS Code Active", source: "screen", detected: true, confidence: 96 },
  { id: "noise", label: "Low Environmental Noise", source: "microphone", detected: true, confidence: 91 },
];

export const initialSystemStatus: SystemStatus = {
  cpu: null,
  gpu: null,
  ramUsed: 0,
  ramTotal: 16,
  ramPercent: 0,
  storageUsed: null,
  storageTotal: null,
  battery: null,
  powerConnected: true,
  cpuFanRpm: null,
  gpuFanRpm: null,
  cpuTemp: null,
  gpuTemp: null,
};

export const initialAIRuntime: AIRuntime = {
  accelerator: "CPU",
  status: "FALLBACK",
  inferenceLatency: null,
  cpuOverhead: 0,
  memory: 0,
  cloudRequests: 0,
  modelCount: 1,
  cloudEnabled: false,
  npuAvailable: false,
  qnnAvailable: false,
  provider: "CPU",
};

export const initialModels: AIModel[] = [
  { id: "vision", name: "Vision Model", status: "loaded", runtime: "NPU", latency: 18, memory: 96, state: "Processing frames at 5 Hz" },
  { id: "audio", name: "Audio Model", status: "loaded", runtime: "NPU", latency: 8, memory: 42, state: "Analyzing audio buffers" },
  { id: "context", name: "Context Model", status: "loaded", runtime: "NPU", latency: 6, memory: 46, state: "Deriving semantic context" },
];

export const initialTimeline: TimelineEvent[] = [
  { id: "t1", time: "09:12", hour: 9, minute: 12, context: "FOCUS", duration: 25, confidence: 89, signals: ["Camera: User present", "Screen: VS Code", "Activity: Keyboard"], explanation: "Sustained keyboard activity in VS Code with minimal audio and stable user presence indicated deep focus." },
  { id: "t2", time: "09:37", hour: 9, minute: 37, context: "CONVERSATION", duration: 3, confidence: 76, signals: ["Audio: Speech detected", "Activity: Reduced"], explanation: "Brief speech detected with reduced keyboard activity suggested a short conversation." },
  { id: "t3", time: "09:40", hour: 9, minute: 40, context: "COLLABORATION", duration: 25, confidence: 81, signals: ["Screen: VS Code + Slack", "Audio: Speech detected", "Activity: Active"], explanation: "Screen sharing with active speech and keyboard activity in collaborative tools indicated teamwork." },
  { id: "t4", time: "10:05", hour: 10, minute: 5, context: "MEETING", duration: 37, confidence: 85, signals: ["Camera: User present", "Audio: Speech detected", "Screen: Video call"], explanation: "Video call active with sustained speech detection and user presence indicated a meeting." },
  { id: "t5", time: "10:42", hour: 10, minute: 42, context: "FOCUS", duration: 36, confidence: 91, signals: ["Screen: VS Code", "Activity: Keyboard", "Audio: Low"], explanation: "Return to VS Code with high keyboard activity and low environmental noise indicated deep focus." },
  { id: "t6", time: "11:18", hour: 11, minute: 18, context: "BREAK", duration: 15, confidence: 74, signals: ["Camera: No user", "Activity: Idle", "Audio: Low"], explanation: "User not detected at desk with all activity sensors idle indicated a break." },
];

export const initialProtectedApps: ProtectedApp[] = [
  { id: "app1", name: "Banking", icon: "Landmark", protected: true },
  { id: "app2", name: "Password Manager", icon: "KeyRound", protected: true },
  { id: "app3", name: "Private Browser", icon: "Globe", protected: true },
  { id: "app4", name: "Messaging", icon: "MessageSquare", protected: false },
];

export const initialPrivacy: PrivacyState = {
  privateMode: false,
  cameraActive: true,
  microphoneActive: true,
  screenActive: true,
  cloudProcessing: false,
  rawVideoStored: false,
  rawAudioStored: false,
  historyPaused: false,
  retention: "7 days",
};

export const privacyPipelineSteps: PrivacyPipelineStep[] = [
  { id: "camera-step", input: "CAMERA FRAME", output: "USER PRESENT", discard: "RAW FRAME DISCARDED" },
  { id: "audio-step", input: "AUDIO BUFFER", output: "SPEECH DETECTED", discard: "RAW AUDIO DISCARDED" },
  { id: "screen-step", input: "SCREEN CONTEXT", output: "VS CODE ACTIVE", discard: "RAW SCREENSHOT DISCARDED" },
  { id: "activity-step", input: "KEYBOARD INPUT", output: "TYPING ACTIVITY", discard: "RAW KEYSTROKES DISCARDED" },
];

export const initialBackground: BackgroundStatus = {
  running: true,
  camera: "active",
  microphone: "active",
  screen: "active",
  cloud: false,
};

export const recentContexts = [
  { time: "09:12", context: "FOCUS" },
  { time: "09:37", context: "CONVERSATION" },
  { time: "09:40", context: "COLLABORATION" },
  { time: "10:05", context: "MEETING" },
  { time: "10:42", context: "FOCUS" },
];
