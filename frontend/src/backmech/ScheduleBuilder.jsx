import { useMemo } from "react";
import { createId } from "./presets";
import { flattenSchedule, totalSeconds, formatDuration } from "./engine";

export default function ScheduleBuilder({ schedule, onChange, onSave }) {
  const phases = useMemo(() => flattenSchedule(schedule), [schedule]);
  const total = useMemo(() => totalSeconds(phases), [phases]);

  function update(partial) {
    onChange({ ...schedule, ...partial });
  }

  function updateExercise(idx, partial) {
    const arr = schedule.exercises.slice();
    arr[idx] = { ...arr[idx], ...partial };
    update({ exercises: arr });
  }

  function updateSet(exIdx, setIdx, partial) {
    const ex = schedule.exercises[exIdx];
    const sets = ex.sets.slice();
    sets[setIdx] = { ...sets[setIdx], ...partial };
    updateExercise(exIdx, { sets });
  }

  function addExercise() {
    const ex = { id: createId("ex"), name: "New Exercise", breakBetweenSetsSeconds: 30, sets: [ { id: createId("set"), reps: 3, holdSeconds: 10, breakBetweenRepsSeconds: 10 } ] };
    update({ exercises: [...schedule.exercises, ex] });
  }

  function removeExercise(idx) {
    const arr = schedule.exercises.slice();
    arr.splice(idx, 1);
    update({ exercises: arr });
  }

  function addSet(exIdx) {
    const ex = schedule.exercises[exIdx];
    const sets = [...ex.sets, { id: createId("set"), reps: 3, holdSeconds: 10, breakBetweenRepsSeconds: 10 }];
    updateExercise(exIdx, { sets });
  }

  function removeSet(exIdx, setIdx) {
    const ex = schedule.exercises[exIdx];
    const sets = ex.sets.slice();
    sets.splice(setIdx, 1);
    updateExercise(exIdx, { sets });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          <span style={{ marginRight: 6 }}>Schedule name:</span>
          <input
            type="text"
            value={schedule.name || ""}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="My Back Routine"
            style={{ padding: 6, minWidth: 240 }}
          />
        </label>
        <label>
          <span style={{ marginRight: 6 }}>Break between exercises (s):</span>
          <input
            type="number"
            min={0}
            value={schedule.breakBetweenExercisesSeconds}
            onChange={(e) => update({ breakBetweenExercisesSeconds: Math.max(0, Number(e.target.value) || 0) })}
            style={{ width: 100, padding: 6 }}
          />
        </label>
        {onSave && (
          <button onClick={() => onSave(schedule)} style={{ padding: "0.5rem 0.75rem" }}>Save</button>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 300, display: "flex", flexDirection: "column", gap: 12 }}>
          {schedule.exercises.map((ex, exIdx) => (
            <div key={ex.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={ex.name}
                    onChange={(e) => updateExercise(exIdx, { name: e.target.value })}
                    placeholder={`Exercise ${exIdx + 1}`}
                    style={{ padding: 6, minWidth: 200 }}
                  />
                  <label>
                    <span style={{ marginRight: 6 }}>Break between sets (s):</span>
                    <input
                      type="number"
                      min={0}
                      value={ex.breakBetweenSetsSeconds}
                      onChange={(e) => updateExercise(exIdx, { breakBetweenSetsSeconds: Math.max(0, Number(e.target.value) || 0) })}
                      style={{ width: 100, padding: 6 }}
                    />
                  </label>
                </div>
                <button onClick={() => removeExercise(exIdx)} style={{ padding: "0.4rem 0.6rem" }}>Remove</button>
              </div>
              <div style={{ marginTop: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", color: "#555" }}>
                      <th style={{ padding: 6 }}>Set</th>
                      <th style={{ padding: 6 }}>Reps</th>
                      <th style={{ padding: 6 }}>Hold (s)</th>
                      <th style={{ padding: 6 }}>Break between reps (s)</th>
                      <th style={{ padding: 6 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ex.sets.map((set, setIdx) => (
                      <tr key={set.id}>
                        <td style={{ padding: 6 }}>{setIdx + 1}</td>
                        <td style={{ padding: 6 }}>
                          <input
                            type="number"
                            min={0}
                            value={set.reps}
                            onChange={(e) => updateSet(exIdx, setIdx, { reps: Math.max(0, Number(e.target.value) || 0) })}
                            style={{ width: 80, padding: 6 }}
                          />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input
                            type="number"
                            min={0}
                            value={set.holdSeconds}
                            onChange={(e) => updateSet(exIdx, setIdx, { holdSeconds: Math.max(0, Number(e.target.value) || 0) })}
                            style={{ width: 80, padding: 6 }}
                          />
                        </td>
                        <td style={{ padding: 6 }}>
                          <input
                            type="number"
                            min={0}
                            value={set.breakBetweenRepsSeconds}
                            onChange={(e) => updateSet(exIdx, setIdx, { breakBetweenRepsSeconds: Math.max(0, Number(e.target.value) || 0) })}
                            style={{ width: 140, padding: 6 }}
                          />
                        </td>
                        <td style={{ padding: 6 }}>
                          <button onClick={() => removeSet(exIdx, setIdx)} style={{ padding: "0.3rem 0.5rem" }}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => addSet(exIdx)} style={{ padding: "0.4rem 0.6rem" }}>Add Set</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={addExercise} style={{ padding: "0.5rem 0.75rem", alignSelf: "flex-start" }}>Add Exercise</button>
        </div>

        <div style={{ flex: 1, minWidth: 260, padding: 12, border: "1px solid #eee", borderRadius: 8 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>Preview</div>
          <div style={{ marginBottom: 6, color: "#222" }}>
            Total time: <strong style={{ fontVariantNumeric: "tabular-nums" }}>{formatDuration(total)}</strong>
          </div>
          <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.6 }}>
            {phases.map((p, i) => (
              <li key={i}>
                <span>{p.label}</span>
                <span style={{ marginLeft: 8, fontVariantNumeric: "tabular-nums", color: "#666" }}>{formatDuration(p.durationSeconds)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}


