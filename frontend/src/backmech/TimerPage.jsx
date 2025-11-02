import { useMemo, useState } from "react";
import TimerView from "./TimerView";
import ScheduleBuilder from "./ScheduleBuilder";
import { PRESET_SCHEDULES, createId } from "./presets";
import { loadCustomSchedules, saveCustomSchedule } from "./storage";

function defaultCustomSchedule() {
  return {
    id: createId("sch"),
    name: "My Back Routine",
    breakBetweenExercisesSeconds: 30,
    exercises: [
      {
        id: createId("ex"),
        name: "Exercise 1",
        breakBetweenSetsSeconds: 20,
        sets: [ { id: createId("set"), reps: 3, holdSeconds: 10, breakBetweenRepsSeconds: 10 } ],
      },
    ],
  };
}

export default function TimerPage({ onBack }) {
  const [mode, setMode] = useState("preset"); // preset | custom
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_SCHEDULES[0]?.id || "");
  const [custom, setCustom] = useState(defaultCustomSchedule());
  const [runningSchedule, setRunningSchedule] = useState(null);

  const customSaved = useMemo(() => loadCustomSchedules(), []);
  const allPresets = PRESET_SCHEDULES;

  function start() {
    const schedule = mode === "preset"
      ? allPresets.find((p) => p.id === selectedPresetId)
      : custom;
    if (!schedule) return;
    setRunningSchedule(schedule);
  }

  function stop() {
    setRunningSchedule(null);
  }

  function handleSaveCurrentCustom(sch) {
    const toSave = { ...sch, id: sch.id || createId("sch") };
    saveCustomSchedule(toSave);
    alert("Saved locally.");
  }

  if (runningSchedule) {
    return (
      <div style={{ minHeight: "100vh", fontFamily: "sans-serif", padding: "1rem", maxWidth: 1000, margin: "0 auto" }}>
        <TimerView schedule={runningSchedule} onBackToConfig={stop} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", fontFamily: "sans-serif", padding: "1rem", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ padding: "0.5rem 0.75rem" }}>Back</button>
        <h2 style={{ margin: 0 }}>Back Mechanic Timer</h2>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="radio" name="mode" value="preset" checked={mode === "preset"} onChange={() => setMode("preset")} />
          Use preset
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="radio" name="mode" value="custom" checked={mode === "custom"} onChange={() => setMode("custom")} />
          Create new
        </label>
      </div>

      {mode === "preset" ? (
        <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <label>
            <span style={{ marginRight: 6 }}>Preset:</span>
            <select value={selectedPresetId} onChange={(e) => setSelectedPresetId(e.target.value)} style={{ padding: 6, minWidth: 260 }}>
              {allPresets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          {customSaved && customSaved.length > 0 && (
            <details>
              <summary style={{ cursor: "pointer" }}>Saved custom schedules</summary>
              <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                {customSaved.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </details>
          )}
          <button onClick={start} style={{ padding: "0.6rem 1rem" }}>Start Timer</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <ScheduleBuilder schedule={custom} onChange={setCustom} onSave={handleSaveCurrentCustom} />
          <div>
            <button onClick={start} style={{ padding: "0.6rem 1rem" }}>Start Timer</button>
          </div>
        </div>
      )}
    </div>
  );
}


