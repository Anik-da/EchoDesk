import { useState } from "react";
import { Camera, Mic, Monitor, Keyboard } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { Switch } from "@/components/ui/Switch";
import { Slider } from "@/components/ui/Slider";
import { StatusDot } from "@/components/ui/StatusDot";
import { cn } from "@/utils/cn";

export function SensorsPage() {
  const { signals, toggleSensor, settings, toggleSetting } = useEchoDesk();

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100">SENSORS</h1>
        <p className="text-xs text-zinc-500">Configure input sensors and detection sensitivity.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Camera */}
        <Panel title="Camera" accent rightSlot={<StatusDot state={signals[0]?.state ?? "off"} />}>
          <SensorContent
            icon={Camera}
            enabled={signals[0]?.enabled ?? false}
            onToggle={() => toggleSensor("camera")}
            description="Presence detection"
            settings={[
              { label: "Presence Detection", key: "cameraSensor" },
            ]}
            toggleSetting={toggleSetting}
            settingsState={settings}
            sliders={[
              { label: "Sampling Frequency", min: 1, max: 30, value: 5, unit: " Hz" },
              { label: "Sensitivity", min: 1, max: 10, value: 7, unit: "" },
            ]}
            stateLabel={signals[0]?.state.toUpperCase() ?? "OFF"}
          />
        </Panel>

        {/* Microphone */}
        <Panel title="Microphone" accent rightSlot={<StatusDot state={signals[1]?.state ?? "off"} />}>
          <SensorContent
            icon={Mic}
            enabled={signals[1]?.enabled ?? false}
            onToggle={() => toggleSensor("microphone")}
            description="Environmental audio"
            settings={[
              { label: "Environmental Audio", key: "micSensor" },
            ]}
            toggleSetting={toggleSetting}
            settingsState={settings}
            sliders={[
              { label: "Sampling Rate", min: 8, max: 48, value: 16, unit: " kHz" },
              { label: "Speech Detection", min: 1, max: 10, value: 5, unit: "" },
            ]}
            stateLabel={signals[1]?.state.toUpperCase() ?? "OFF"}
          />
          <div className="mt-2 rounded border border-zinc-800/60 bg-zinc-950/30 px-2 py-1.5 text-[10px] text-zinc-500">
            Audio is processed locally for speech detection only. No audio is recorded or stored.
          </div>
        </Panel>

        {/* Screen */}
        <Panel title="Screen" accent rightSlot={<StatusDot state={signals[2]?.state ?? "off"} />}>
          <SensorContent
            icon={Monitor}
            enabled={signals[2]?.enabled ?? false}
            onToggle={() => toggleSensor("screen")}
            description="Application context"
            settings={[
              { label: "Application Context", key: "screenSensor" },
            ]}
            toggleSetting={toggleSetting}
            settingsState={settings}
            sliders={[
              { label: "OCR Sensitivity", min: 1, max: 10, value: 6, unit: "" },
            ]}
            stateLabel={signals[2]?.state.toUpperCase() ?? "OFF"}
          />
          <div className="mt-2 rounded border border-zinc-800/60 bg-zinc-950/30 px-2 py-1.5 text-[10px] text-zinc-500">
            Screen context detects active application only. No screenshots are captured or stored.
          </div>
        </Panel>

        {/* Activity */}
        <Panel title="Activity" accent rightSlot={<StatusDot state={signals[3]?.state ?? "off"} />}>
          <SensorContent
            icon={Keyboard}
            enabled={signals[3]?.enabled ?? false}
            onToggle={() => toggleSensor("activity")}
            description="Keyboard & mouse activity"
            settings={[
              { label: "Activity Sensing", key: "activitySensor" },
            ]}
            toggleSetting={toggleSetting}
            settingsState={settings}
            sliders={[
              { label: "Idle Threshold", min: 1, max: 30, value: 5, unit: " min" },
            ]}
            stateLabel={signals[3]?.state.toUpperCase() ?? "OFF"}
          />
          <div className="mt-2 rounded border border-zinc-800/60 bg-zinc-950/30 px-2 py-1.5 text-[10px] text-zinc-500">
            Only activity state is tracked (active/idle). Keystrokes are never recorded or stored.
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SensorContent({
  icon: Icon,
  enabled,
  onToggle,
  description,
  settings: settingItems,
  toggleSetting,
  settingsState,
  sliders,
  stateLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  onToggle: () => void;
  description: string;
  settings: { label: string; key: string }[];
  toggleSetting: (key: string) => void;
  settingsState: Record<string, boolean>;
  sliders: { label: string; min: number; max: number; value: number; unit: string }[];
  stateLabel: string;
}) {
  const [sliderValues, setSliderValues] = useState(sliders.map((s) => s.value));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2.5">
        <Icon className={cn("h-4 w-4", enabled ? "text-zinc-300" : "text-zinc-700")} />
        <span className="text-xs text-zinc-400">{description}</span>
        <div className="ml-auto">
          <Switch checked={enabled} onChange={onToggle} size="sm" />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-zinc-800 pt-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-600">Status</span>
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-wider",
          enabled ? "text-emerald-400" : "text-zinc-600"
        )}>{stateLabel}</span>
      </div>

      {sliders.map((slider, i) => (
        <Slider
          key={slider.label}
          label={slider.label}
          min={slider.min}
          max={slider.max}
          value={sliderValues[i]}
          unit={slider.unit}
          onChange={(v) => setSliderValues((prev) => prev.map((p, idx) => (idx === i ? v : p)))}
        />
      ))}

      {settingItems.map((s) => (
        <div key={s.key} className="flex items-center justify-between border-t border-zinc-800 pt-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">{s.label}</span>
          <Switch checked={settingsState[s.key] ?? false} onChange={() => toggleSetting(s.key)} size="sm" />
        </div>
      ))}
    </div>
  );
}
