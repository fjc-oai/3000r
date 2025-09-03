const API = localStorage.getItem("engtrack_api") || "http://localhost:8000";
const studyForm = document.getElementById("study-form");
const vocabForm = document.getElementById("vocab-form");
const studyList = document.getElementById("study-list");
const vocabList = document.getElementById("vocab-list");
const monthlyStats = document.getElementById("monthly-stats");

document.getElementById("study-date").value = new Date().toISOString().slice(0,10);

studyForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const payload = {
    date: document.getElementById("study-date").value,
    minutes: Number(document.getElementById("study-minutes").value),
    activity: document.getElementById("study-activity").value,
    notes: document.getElementById("study-notes").value || null,
  };
  await fetch(`${API}/study_sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  await refreshStudy();
  await refreshMonthly();
  studyForm.reset();
  document.getElementById("study-date").value = new Date().toISOString().slice(0,10);
});

vocabForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const examples = document.getElementById("v-examples").value.split("\\n").map(s => s.trim()).filter(Boolean);
  const tags = document.getElementById("v-tags").value.split(",").map(s => s.trim()).filter(Boolean);
  const payload = {
    word: document.getElementById("v-word").value.trim(),
    meaning: document.getElementById("v-meaning").value.trim() || null,
    examples: examples.length ? examples : null,
    tags: tags.length ? tags : null
  };
  await fetch(`${API}/vocab`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  vocabForm.reset();
  await refreshVocab();
});

document.getElementById("refresh-vocab").addEventListener("click", refreshVocab);

async function refreshStudy() {
  const res = await fetch(`${API}/study_sessions`);
  const data = await res.json();
  studyList.innerHTML = data.map(r => `
    <div class="row">
      <div>
        <strong>${r.date}</strong> <span class="badge">${r.activity}</span>
        ${r.notes ? `<div class="small">${escapeHtml(r.notes)}</div>` : ""}
      </div>
      <div><strong>${r.minutes} min</strong></div>
    </div>
  `).join("") || `<div class="small">No sessions yet.</div>`;
}

async function refreshVocab() {
  const q = document.getElementById("search-q").value.trim();
  const tag = document.getElementById("search-tag").value.trim();
  const due = document.getElementById("filter-due").checked;
  const url = new URL(`${API}/vocab`);
  if (q) url.searchParams.set("q", q);
  if (tag) url.searchParams.set("tag", tag);
  if (due) url.searchParams.set("due", "true");
  const res = await fetch(url.toString());
  const items = await res.json();
  vocabList.innerHTML = items.map(item => renderVocab(item)).join("") || `<div class="small">No words yet.</div>`;
}

function renderVocab(v) {
  const tags = (v.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join(" ");
  const due = v.next_review_at ? new Date(v.next_review_at) : null;
  const dueStr = due ? due.toLocaleDateString() : "—";
  const examples = (v.examples || []).map(ex => `<div class="small">• ${escapeHtml(ex)}</div>`).join("");
  return `
    <div class="row">
      <div>
        <div><strong>${escapeHtml(v.word)}</strong> ${tags}</div>
        ${v.meaning ? `<div class="small">${escapeHtml(v.meaning)}</div>` : ""}
        ${examples}
        <div class="small">reps: ${v.reps ?? 0} | ease: ${v.ease?.toFixed(2) ?? "2.50"} | interval: ${v.interval ?? 1}d | next: ${dueStr}</div>
      </div>
      <div class="review-btns">
        ${[0,1,2,3,4,5].map(g => `<button onclick="review('${v.id}', ${g})">${g}</button>`).join("")}
      </div>
    </div>
  `;
}

async function review(id, grade) {
  await fetch(`${API}/vocab/${id}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grade })
  });
  await refreshVocab();
}

async function refreshMonthly() {
  const res = await fetch(`${API}/stats/monthly`);
  const data = await res.json();
  if (!data.length) {
    monthlyStats.innerHTML = `<div class="small">No data yet.</div>`;
    return;
  }
  const total = data.reduce((a,b)=>a+b.minutes,0);
  const best = data.reduce((m, r) => r.minutes > m.minutes ? r : m, data[0]);
  const recent = data.slice(0,3).map(r => `<div class="stat"><div class="small">${r.month.slice(0,7)}</div><div><strong>${r.minutes} min</strong></div></div>`).join("");
  monthlyStats.innerHTML = `
    <div class="stats-grid">
      <div class="stat"><div class="small">total (shown)</div><div><strong>${total} min</strong></div></div>
      <div class="stat"><div class="small">best month</div><div><strong>${best.month.slice(0,7)} • ${best.minutes} min</strong></div></div>
      ${recent}
    </div>
  `;
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

refreshStudy();
refreshVocab();
refreshMonthly();
