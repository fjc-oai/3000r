const KEY = "backmech_schedules_v1";

export function loadCustomSchedules() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomSchedule(schedule) {
  const all = loadCustomSchedules();
  const idx = all.findIndex((s) => s && s.id === schedule.id);
  if (idx >= 0) {
    all[idx] = schedule;
  } else {
    all.push(schedule);
  }
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteCustomSchedule(id) {
  const all = loadCustomSchedules().filter((s) => s && s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}


