import { useEffect, useMemo, useRef, useState } from "react";
import { flattenSchedule, formatDuration, totalSeconds } from "./engine";

export default function TimerView({ schedule, onBackToConfig }) {
  const phases = useMemo(() => flattenSchedule(schedule), [schedule]);
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(phases[0]?.durationSeconds || 0);
  const [running, setRunning] = useState(true);
  const [beep, setBeep] = useState(true);
  const intervalRef = useRef(null);

  const total = useMemo(() => totalSeconds(phases), [phases]);
  const elapsed = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < index; i++) sum += phases[i]?.durationSeconds || 0;
    return sum + ((phases[index]?.durationSeconds || 0) - remaining);
  }, [index, remaining, phases]);

  useEffect(() => {
    setRemaining(phases[index]?.durationSeconds || 0);
  }, [index, phases]);

  useEffect(() => {
    if (!running) return;
    if (remaining <= 0) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          handleNext();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, index, phases]);

  function playBeep() {
    if (!beep) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
      o.start();
      o.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // ignore
    }
  }

  function handleNext() {
    if (index < phases.length - 1) {
      setIndex((i) => i + 1);
      playBeep();
    } else {
      setRunning(false);
      playBeep();
    }
  }

  const current = phases[index] || null;
  const next = phases[index + 1] || null;
  const progress = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={onBackToConfig} style={{ padding: "0.5rem 0.75rem" }}>End Session</button>
          <strong>{schedule?.name || "Unnamed schedule"}</strong>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={beep} onChange={(e) => setBeep(e.target.checked)} />
          Beep on phase change
        </label>
      </div>

      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 6 }}>Overall</div>
        <div style={{ height: 10, background: "#f2f2f2", borderRadius: 6, overflow: "hidden" }}>
          <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: "#4f46e5", transition: "width 0.3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontVariantNumeric: "tabular-nums", fontSize: 14, color: "#444" }}>
          <span>Elapsed {formatDuration(Math.floor(elapsed))}</span>
          <span>Total {formatDuration(total)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 260, padding: 16, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Current</div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>
            {current ? current.label : "Done"}
          </div>
          <div style={{ fontSize: 48, fontVariantNumeric: "tabular-nums", marginBottom: 8 }}>
            {formatDuration(remaining)}
          </div>
          {/* Auto-run: controls are intentionally minimal */}
        </div>
        <div style={{ flex: 1, minWidth: 260, padding: 16, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Up Next</div>
          <div style={{ fontSize: 18, marginBottom: 6 }}>
            {next ? next.label : "—"}
          </div>
          <div style={{ fontVariantNumeric: "tabular-nums" }}>
            {next ? formatDuration(next.durationSeconds) : ""}
          </div>
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>All Phases</div>
        <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
          {phases.map((p, i) => (
            <li key={i} style={{ color: i === index ? "#111" : "#555" }}>
              <span>{p.label}</span>
              <span style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums", color: "#666" }}>{formatDuration(p.durationSeconds)}</span>
              {i === index && <span style={{ marginLeft: 8, color: "#4f46e5" }}>(current)</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}


