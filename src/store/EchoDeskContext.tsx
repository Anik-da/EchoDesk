import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type {
  ContextMode,
  ContextState,
  SamplingMode,
  SensorSignal,
  SemanticEvent,
  SystemStatus,
  AIRuntime,
  AIModel,
  TimelineEvent,
  ProtectedApp,
  PrivacyState,
  BackgroundStatus,
  DeviceSystemInfo,
} from "@/types";
import {
  modeContextMap,
  initialSignals,
  initialEvents,
  initialSystemStatus,
  initialAIRuntime,
  initialModels,
  initialTimeline,
  initialProtectedApps,
  initialPrivacy,
  initialBackground,
} from "@/data/mockData";

interface EchoDeskState {
  // Navigation
  activeNav: string;
  setActiveNav: (nav: string) => void;

  // Connection
  engineConnectionStatus: string;
  setEngineConnectionStatus: (s: string) => void;

  // Context mode
  contextMode: ContextMode;
  setContextMode: (mode: ContextMode) => void;
  currentContext: ContextState;
  contextSubtitle: string;
  contextConfidence: number;
  contextSignals: string[];
  setLiveContextInfo: (subtitle: string, confidence: number, signals: string[]) => void;

  // Sampling
  samplingMode: SamplingMode;
  setSamplingMode: (mode: SamplingMode) => void;

  // Sensors
  signals: SensorSignal[];
  setSignals: React.Dispatch<React.SetStateAction<SensorSignal[]>>;
  toggleSensor: (id: string) => void;

  // Semantic events
  events: SemanticEvent[];
  setEvents: React.Dispatch<React.SetStateAction<SemanticEvent[]>>;

  // System status
  systemStatus: SystemStatus;
  setSystemStatus: React.Dispatch<React.SetStateAction<SystemStatus>>;

  // AI Runtime
  aiRuntime: AIRuntime;
  setAIRuntime: React.Dispatch<React.SetStateAction<AIRuntime>>;
  models: AIModel[];

  // Timeline
  timeline: TimelineEvent[];
  setTimelineEvents: (events: TimelineEvent[]) => void;

  // Privacy
  privacy: PrivacyState;
  setPrivacy: (p: PrivacyState) => void;
  togglePrivateMode: () => void;
  protectedApps: ProtectedApp[];
  setProtectedApps: (apps: ProtectedApp[]) => void;
  toggleProtectedApp: (id: string) => void;
  addProtectedApp: (name: string) => void;
  removeProtectedApp: (id: string) => void;

  // Background
  background: BackgroundStatus;
  setBackground: (b: BackgroundStatus) => void;

  // Settings & Simulation
  telemetryMode: "LIVE" | "SIMULATION";
  setTelemetryMode: (mode: "LIVE" | "SIMULATION") => void;
  deviceInfo: DeviceSystemInfo | null;
  setDeviceInfo: (info: DeviceSystemInfo | null) => void;
  liveSimulation: boolean;
  toggleLiveSimulation: () => void;
  devScenario: string;
  setDevScenario: (scenario: string) => void;
  settings: Record<string, boolean>;
  toggleSetting: (key: string) => void;

  // App detail panel
  selectedTimelineEvent: TimelineEvent | null;
  setSelectedTimelineEvent: (e: TimelineEvent | null) => void;
  selectedModel: AIModel | null;
  setSelectedModel: (m: AIModel | null) => void;
  selectedSignal: SensorSignal | null;
  setSelectedSignal: (s: SensorSignal | null) => void;
}

const EchoDeskContext = createContext<EchoDeskState | null>(null);

export function EchoDeskProvider({ children }: { children: ReactNode }) {
  const [activeNav, setActiveNav] = useState("system");
  const [engineConnectionStatus, setEngineConnectionStatus] = useState("SEARCHING ENGINE...");
  const [telemetryMode, setTelemetryModeState] = useState<"LIVE" | "SIMULATION">("LIVE");
  const [deviceInfo, setDeviceInfo] = useState<DeviceSystemInfo | null>(null);
  const [contextMode, setContextModeState] = useState<ContextMode>("DEEP FOCUS");
  const [samplingMode, setSamplingMode] = useState<SamplingMode>("BALANCED");
  const [signals, setSignals] = useState<SensorSignal[]>(initialSignals);
  const [events, setEvents] = useState<SemanticEvent[]>(initialEvents);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [aiRuntime, setAIRuntime] = useState<AIRuntime>(initialAIRuntime);
  const [models] = useState<AIModel[]>(initialModels);
  const [timeline, setTimeline] = useState<TimelineEvent[]>(initialTimeline);
  const [privacy, setPrivacy] = useState<PrivacyState>(initialPrivacy);
  const [protectedApps, setProtectedApps] = useState<ProtectedApp[]>(initialProtectedApps);
  const [background, setBackground] = useState<BackgroundStatus>(initialBackground);
  const [liveSimulation, setLiveSimulation] = useState(false); // Default to LIVE HARDWARE
  const [devScenario, setDevScenarioState] = useState("Deep Coding Session");
  const [settings, setSettings] = useState<Record<string, boolean>>({
    launchAtStartup: true,
    minimizeToTray: true,
    automaticSensing: true,
    cameraSensor: true,
    micSensor: true,
    screenSensor: true,
    activitySensor: true,
    privateModeSetting: false,
    protectedAppsSetting: true,
    contextRetention: true,
    localProcessing: true,
    hardwareAccel: true,
    animations: true,
  });

  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<SensorSignal | null>(null);

  const [liveSubtitle, setLiveSubtitle] = useState<string | null>(null);
  const [liveConfidence, setLiveConfidence] = useState<number | null>(null);
  const [liveSignals, setLiveSignals] = useState<string[] | null>(null);

  const modeData = modeContextMap[contextMode] || modeContextMap["BALANCED"];

  const setLiveContextInfo = useCallback((subtitle: string, confidence: number, signals: string[]) => {
    setLiveSubtitle(subtitle);
    setLiveConfidence(confidence);
    setLiveSignals(signals);
  }, []);

  const setContextMode = useCallback((mode: ContextMode) => {
    setContextModeState(mode);
    if (mode === "PRIVATE") {
      setPrivacy((p) => ({
        ...p,
        privateMode: true,
        cameraActive: false,
        microphoneActive: false,
        screenActive: false,
        historyPaused: true,
      }));
      setSignals((prev) =>
        prev.map((s) => ({ ...s, state: "off" as const, enabled: false, activityLevel: 0 }))
      );
    } else {
      setPrivacy((p) => ({
        ...p,
        privateMode: false,
        cameraActive: true,
        microphoneActive: true,
        screenActive: true,
        historyPaused: false,
      }));
      setSignals(initialSignals);
    }
  }, []);

  const setDevScenario = useCallback((scenario: string) => {
    setDevScenarioState(scenario);
    if (scenario === "Deep Coding Session") {
      setContextMode("DEEP FOCUS");
    } else if (scenario === "Zoom Meeting") {
      setContextMode("MEETING");
    } else if (scenario === "Team Collaboration") {
      setContextMode("COLLABORATION");
    } else if (scenario === "On Break") {
      setContextMode("BALANCED");
    } else if (scenario === "Protected App Active") {
      setContextMode("PRIVATE");
    }
  }, [setContextMode]);

  const toggleSensor = useCallback((id: string) => {
    setSignals((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, enabled: !s.enabled, state: !s.enabled ? "active" : "off", activityLevel: !s.enabled ? 50 : 0 }
          : s
      )
    );
  }, []);

  const togglePrivateMode = useCallback(() => {
    setPrivacy((p) => {
      const newPrivate = !p.privateMode;
      if (newPrivate) {
        setContextMode("PRIVATE");
      } else {
        setContextMode("DEEP FOCUS");
      }
      return {
        ...p,
        privateMode: newPrivate,
        cameraActive: !newPrivate,
        microphoneActive: !newPrivate,
        screenActive: !newPrivate,
        cloudProcessing: false,
        historyPaused: newPrivate,
      };
    });
  }, [setContextMode]);

  const toggleProtectedApp = useCallback((id: string) => {
    setProtectedApps((prev) => prev.map((a) => (a.id === id ? { ...a, protected: !a.protected } : a)));
  }, []);

  const addProtectedApp = useCallback((name: string) => {
    setProtectedApps((prev) => [...prev, { id: `app${Date.now()}`, name, icon: "Shield", protected: true }]);
  }, []);

  const removeProtectedApp = useCallback((id: string) => {
    setProtectedApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const setTelemetryMode = useCallback((mode: "LIVE" | "SIMULATION") => {
    setTelemetryModeState(mode);
    setLiveSimulation(mode === "SIMULATION");
    import("@/services/backendBridge").then(({ BackendBridge }) => {
      BackendBridge.setTelemetryMode(mode);
    });
  }, []);

  const toggleLiveSimulation = useCallback(() => {
    setLiveSimulation((prev) => {
      const next = !prev;
      const nextMode = next ? "SIMULATION" : "LIVE";
      setTelemetryModeState(nextMode);
      import("@/services/backendBridge").then(({ BackendBridge }) => {
        BackendBridge.setTelemetryMode(nextMode);
      });
      return next;
    });
  }, []);

  const toggleSetting = useCallback((key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const value: EchoDeskState = {
    activeNav,
    setActiveNav,
    engineConnectionStatus,
    setEngineConnectionStatus,
    telemetryMode,
    setTelemetryMode,
    deviceInfo,
    setDeviceInfo,
    contextMode,
    setContextMode,
    currentContext: modeData.context as ContextState,
    contextSubtitle: liveSubtitle || modeData.subtitle,
    contextConfidence: liveConfidence ?? modeData.confidence,
    contextSignals: liveSignals || modeData.signals,
    setLiveContextInfo,
    samplingMode,
    setSamplingMode,
    signals,
    setSignals,
    toggleSensor,
    events,
    setEvents,
    systemStatus,
    setSystemStatus,
    aiRuntime,
    setAIRuntime,
    models,
    timeline,
    setTimelineEvents: setTimeline,
    privacy,
    setPrivacy,
    togglePrivateMode,
    protectedApps,
    setProtectedApps,
    toggleProtectedApp,
    addProtectedApp,
    removeProtectedApp,
    background,
    setBackground,
    liveSimulation,
    toggleLiveSimulation,
    devScenario,
    setDevScenario,
    settings,
    toggleSetting,
    selectedTimelineEvent,
    setSelectedTimelineEvent,
    selectedModel,
    setSelectedModel,
    selectedSignal,
    setSelectedSignal,
  };

  return <EchoDeskContext.Provider value={value}>{children}</EchoDeskContext.Provider>;
}

export function useEchoDesk() {
  const ctx = useContext(EchoDeskContext);
  if (!ctx) throw new Error("useEchoDesk must be used within EchoDeskProvider");
  return ctx;
}
