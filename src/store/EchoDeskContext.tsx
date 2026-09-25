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

  // Context mode
  contextMode: ContextMode;
  setContextMode: (mode: ContextMode) => void;
  currentContext: ContextState;
  contextSubtitle: string;
  contextConfidence: number;
  contextSignals: string[];

  // Sampling
  samplingMode: SamplingMode;
  setSamplingMode: (mode: SamplingMode) => void;

  // Sensors
  signals: SensorSignal[];
  toggleSensor: (id: string) => void;

  // Semantic events
  events: SemanticEvent[];

  // System status
  systemStatus: SystemStatus;
  setSystemStatus: (s: SystemStatus) => void;

  // AI Runtime
  aiRuntime: AIRuntime;
  setAIRuntime: (r: AIRuntime) => void;
  models: AIModel[];

  // Timeline
  timeline: TimelineEvent[];

  // Privacy
  privacy: PrivacyState;
  setPrivacy: (p: PrivacyState) => void;
  togglePrivateMode: () => void;
  protectedApps: ProtectedApp[];
  toggleProtectedApp: (id: string) => void;
  addProtectedApp: (name: string) => void;
  removeProtectedApp: (id: string) => void;

  // Background
  background: BackgroundStatus;
  setBackground: (b: BackgroundStatus) => void;

  // Settings
  liveSimulation: boolean;
  toggleLiveSimulation: () => void;
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
  const [contextMode, setContextModeState] = useState<ContextMode>("DEEP FOCUS");
  const [samplingMode, setSamplingMode] = useState<SamplingMode>("BALANCED");
  const [signals, setSignals] = useState<SensorSignal[]>(initialSignals);
  const [events] = useState<SemanticEvent[]>(initialEvents);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(initialSystemStatus);
  const [aiRuntime, setAIRuntime] = useState<AIRuntime>(initialAIRuntime);
  const [models] = useState<AIModel[]>(initialModels);
  const [timeline] = useState<TimelineEvent[]>(initialTimeline);
  const [privacy, setPrivacy] = useState<PrivacyState>(initialPrivacy);
  const [protectedApps, setProtectedApps] = useState<ProtectedApp[]>(initialProtectedApps);
  const [background, setBackground] = useState<BackgroundStatus>(initialBackground);
  const [liveSimulation, setLiveSimulation] = useState(true);
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

  const modeData = modeContextMap[contextMode];

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

  const toggleLiveSimulation = useCallback(() => setLiveSimulation((v) => !v), []);

  const toggleSetting = useCallback((key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const value: EchoDeskState = {
    activeNav,
    setActiveNav,
    contextMode,
    setContextMode,
    currentContext: modeData.context as ContextState,
    contextSubtitle: modeData.subtitle,
    contextConfidence: modeData.confidence,
    contextSignals: modeData.signals,
    samplingMode,
    setSamplingMode,
    signals,
    toggleSensor,
    events,
    systemStatus,
    setSystemStatus,
    aiRuntime,
    setAIRuntime,
    models,
    timeline,
    privacy,
    setPrivacy,
    togglePrivateMode,
    protectedApps,
    toggleProtectedApp,
    addProtectedApp,
    removeProtectedApp,
    background,
    setBackground,
    liveSimulation,
    toggleLiveSimulation,
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
