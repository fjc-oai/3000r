// Timer engine: flatten hierarchical schedule into sequential phases

export function isPositiveNumber(n) {
  return typeof n === "number" && isFinite(n) && n > 0;
}

export function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// schedule shape:
// {
//   id, name, breakBetweenExercisesSeconds,
//   exercises: [
//     { id, name, breakBetweenSetsSeconds, sets: [ { id, reps, holdSeconds, breakBetweenRepsSeconds } ] }
//   ]
// }

export function flattenSchedule(schedule) {
  const phases = [];
  if (!schedule || !Array.isArray(schedule.exercises)) return phases;
  const bex = Number(schedule.breakBetweenExercisesSeconds) || 0;
  schedule.exercises.forEach((ex, exIdx) => {
    const sets = Array.isArray(ex?.sets) ? ex.sets : [];
    const bsets = Number(ex?.breakBetweenSetsSeconds) || 0;
    sets.forEach((set, setIdx) => {
      const reps = Math.max(0, Number(set?.reps) || 0);
      const hold = Math.max(0, Number(set?.holdSeconds) || 0);
      const breps = Math.max(0, Number(set?.breakBetweenRepsSeconds) || 0);
      for (let r = 1; r <= reps; r++) {
        if (isPositiveNumber(hold)) {
          phases.push({
            type: "hold",
            label: `${ex?.name || "Exercise"} – Set ${setIdx + 1} Rep ${r}`,
            durationSeconds: hold,
            meta: { exerciseIndex: exIdx, setIndex: setIdx, repIndex: r - 1 },
          });
        }
        if (r < reps && isPositiveNumber(breps)) {
          phases.push({
            type: "break",
            label: "Break between reps",
            durationSeconds: breps,
            meta: { exerciseIndex: exIdx, setIndex: setIdx },
          });
        }
      }
      if (setIdx < sets.length - 1 && isPositiveNumber(bsets)) {
        phases.push({ type: "break", label: "Break between sets", durationSeconds: bsets, meta: { exerciseIndex: exIdx } });
      }
    });
    if (exIdx < schedule.exercises.length - 1 && isPositiveNumber(bex)) {
      phases.push({ type: "break", label: "Break between exercises", durationSeconds: bex, meta: {} });
    }
  });
  return phases;
}

export function totalSeconds(phases) {
  return (phases || []).reduce((acc, p) => acc + (Number(p?.durationSeconds) || 0), 0);
}


