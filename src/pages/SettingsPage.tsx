import { Settings as SettingsIcon, Monitor, ShieldCheck, Cpu, Palette, Zap } from "lucide-react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Panel } from "@/components/ui/Panel";
import { Switch } from "@/components/ui/Switch";
import { ModeSelector } from "@/components/ui/ModeSelector";
import { cn } from "@/utils/cn";

export function SettingsPage() {
  const { settings, toggleSetting, privacy, setPrivacy } = useEchoDesk();

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div>
        <h1 className="text-lg font-bold tracking-wide text-zinc-100">SETTINGS</h1>
        <p className="text-xs text-zinc-500">Configure EchoDesk behavior and preferences.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* General */}
        <Panel title="General" accent>
          <div className="space-y-2">
            <SettingRow label="Launch at Startup" settingKey="launchAtStartup" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Minimize to Tray" settingKey="minimizeToTray" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Automatic Sensing" settingKey="automaticSensing" settings={settings} onToggle={toggleSetting} />
          </div>
        </Panel>

        {/* Sensors */}
        <Panel title="Sensors" accent>
          <div className="space-y-2">
            <SettingRow label="Camera" settingKey="cameraSensor" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Microphone" settingKey="micSensor" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Screen Context" settingKey="screenSensor" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Activity Sensing" settingKey="activitySensor" settings={settings} onToggle={toggleSetting} />
          </div>
        </Panel>

        {/* Privacy */}
        <Panel title="Privacy" accent>
          <div className="space-y-2">
            <SettingRow label="Private Mode" settingKey="privateModeSetting" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Protected Applications" settingKey="protectedAppsSetting" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Context Retention" settingKey="contextRetention" settings={settings} onToggle={toggleSetting} />
            <div className="border-t border-zinc-800 pt-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Retention Period</div>
              <ModeSelector
                options={[
                  { label: "1d", value: "1 day" },
                  { label: "7d", value: "7 days" },
                  { label: "30d", value: "30 days" },
                  { label: "Never", value: "Never" },
                ]}
                value={privacy.retention}
                onChange={(v) => setPrivacy({ ...privacy, retention: v as typeof privacy.retention })}
                size="sm"
              />
            </div>
          </div>
        </Panel>

        {/* AI Runtime */}
        <Panel title="AI Runtime" accent>
          <div className="space-y-2">
            <SettingRow label="Local Processing" settingKey="localProcessing" settings={settings} onToggle={toggleSetting} />
            <SettingRow label="Hardware Acceleration" settingKey="hardwareAccel" settings={settings} onToggle={toggleSetting} />
            <div className="border-t border-zinc-800 pt-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Sampling Rate</div>
              <ModeSelector
                options={[
                  { label: "Low", value: "LOW POWER" },
                  { label: "Balanced", value: "BALANCED" },
                  { label: "Real-Time", value: "REAL-TIME" },
                ]}
                value="BALANCED"
                onChange={() => {}}
                size="sm"
              />
            </div>
          </div>
        </Panel>

        {/* Appearance */}
        <Panel title="Appearance" accent className="col-span-2">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Theme</div>
              <ModeSelector
                options={[
                  { label: "Dark", value: "dark" },
                  { label: "Graphite", value: "graphite" },
                ]}
                value="dark"
                onChange={() => {}}
                size="sm"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5">Density</div>
              <ModeSelector
                options={[
                  { label: "Compact", value: "compact" },
                  { label: "Normal", value: "normal" },
                ]}
                value="compact"
                onChange={() => {}}
                size="sm"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-2">Animations</div>
              <Switch checked={settings.animations} onChange={() => toggleSetting("animations")} />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  settingKey,
  settings,
  onToggle,
}: {
  label: string;
  settingKey: string;
  settings: Record<string, boolean>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2 last:border-0">
      <span className="text-xs text-zinc-400">{label}</span>
      <Switch checked={settings[settingKey] ?? false} onChange={() => onToggle(settingKey)} size="sm" />
    </div>
  );
}
