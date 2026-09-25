import { useState } from "react";
import { useEchoDesk } from "@/store/EchoDeskContext";
import { Sliders } from "lucide-react";

export function SamplingControl() {
  const { samplingMode, setSamplingMode } = useEchoDesk();
  const [freqHz, setFreqHz] = useState(2.0);
  const [confidenceThresh, setConfidenceThresh] = useState(80);
  const [latencyCap, setLatencyCap] = useState(50);

  return (
    <div className="gcc-module rounded p-3 font-mono text-xs select-none space-y-2.5">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Sliders className="h-3.5 w-3.5 text-lime-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">
            Configuration & AI Sampling
          </span>
        </div>
        <div className="flex items-center gap-1">
          {["LOW POWER", "BALANCED", "REAL-TIME"].map((m) => (
            <button
              key={m}
              onClick={() => {
                setSamplingMode(m as any);
                if (m === "LOW POWER") { setFreqHz(1.0); setConfidenceThresh(85); setLatencyCap(80); }
                else if (m === "BALANCED") { setFreqHz(2.0); setConfidenceThresh(80); setLatencyCap(50); }
                else if (m === "REAL-TIME") { setFreqHz(5.0); setConfidenceThresh(75); setLatencyCap(30); }
              }}
              className={`rounded px-2 py-0.5 text-[8px] uppercase font-bold transition-all ${
                samplingMode === m ? "bg-lime-500/20 text-lime-400 border border-lime-500/40" : "bg-zinc-900 text-zinc-500"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Interactive Sliders (GIGABYTE Configuration Panel Style with Ticks) */}
      <div className="grid grid-cols-3 gap-4 pt-1">
        {/* Sampling Frequency */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-zinc-400 uppercase">SAMPLING FREQ</span>
            <span className="text-lime-400 font-bold">{freqHz.toFixed(1)} Hz</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="10.0"
            step="0.5"
            value={freqHz}
            onChange={(e) => setFreqHz(parseFloat(e.target.value))}
            className="gcc-slider w-full"
          />
          <div className="flex justify-between text-[7px] text-zinc-600">
            <span>0.5</span>
            <span>5.0</span>
            <span>10.0</span>
          </div>
        </div>

        {/* Confidence Threshold */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-zinc-400 uppercase">CONFIDENCE THRESH</span>
            <span className="text-cyan-400 font-bold">{confidenceThresh}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="1"
            value={confidenceThresh}
            onChange={(e) => setConfidenceThresh(parseInt(e.target.value))}
            className="gcc-slider w-full"
          />
          <div className="flex justify-between text-[7px] text-zinc-600">
            <span>50%</span>
            <span>75%</span>
            <span>95%</span>
          </div>
        </div>

        {/* Latency Cap */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-zinc-400 uppercase">LATENCY CAP</span>
            <span className="text-amber-400 font-bold">{latencyCap} ms</span>
          </div>
          <input
            type="range"
            min="15"
            max="100"
            step="5"
            value={latencyCap}
            onChange={(e) => setLatencyCap(parseInt(e.target.value))}
            className="gcc-slider w-full"
          />
          <div className="flex justify-between text-[7px] text-zinc-600">
            <span>15ms</span>
            <span>50ms</span>
            <span>100ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
