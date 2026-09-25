import { EchoDeskProvider, useEchoDesk } from "@/store/EchoDeskContext";
import { useLiveSimulation } from "@/hooks/useLiveSimulation";
import { TopBar } from "@/components/layout/TopBar";
import { IconRail } from "@/components/layout/IconRail";
import { DashboardPage } from "@/pages/DashboardPage";
import { LiveContextPage } from "@/pages/LiveContextPage";
import { TimelinePage } from "@/pages/TimelinePage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { AIRuntimePage } from "@/pages/AIRuntimePage";
import { SensorsPage } from "@/pages/SensorsPage";
import { SettingsPage } from "@/pages/SettingsPage";

function AppContent() {
  const { activeNav } = useEchoDesk();
  useLiveSimulation();

  const renderPage = () => {
    switch (activeNav) {
      case "system": return <DashboardPage />;
      case "context": return <LiveContextPage />;
      case "timeline": return <TimelinePage />;
      case "privacy": return <PrivacyPage />;
      case "runtime": return <AIRuntimePage />;
      case "sensors": return <SensorsPage />;
      case "settings": return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0a0a0b] text-zinc-100">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <IconRail />
        <main className="flex-1 overflow-hidden">
          <div key={activeNav} className="ed-fade-enter h-full">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <EchoDeskProvider>
      <AppContent />
    </EchoDeskProvider>
  );
}

export default App;
