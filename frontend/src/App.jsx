import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "/api";


function AddTopicForm({ topicName, setTopicName, submitting, onSubmit }) {
  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
      <input
        type="text"
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
        placeholder="New topic"
        required
        style={{ flex: 1, padding: 8, fontSize: 16 }}
      />
      <button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add"}</button>
    </form>
  );
}

function TopicList({ topics, loading }) {
  if (loading) return <p>Loading...</p>;
  if (!topics || topics.length === 0) return <p>No topics.</p>;
  return (
    <ul style={{ paddingLeft: 18 }}>
      {topics.map((t) => (
        <li key={t.id} style={{ marginBottom: 6 }}>
          <strong>{t.name}</strong>
        </li>
      ))}
    </ul>
  );
}


function App() {
  const [page, setPage] = useState("home");
  const [sessions, setSessions] = useState([]);
  const [sessionStartMs, setSessionStartMs] = useState(null);
  const [sessionEndMs, setSessionEndMs] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [sessionWords, setSessionWords] = useState([]);
  const [quickDurMin, setQuickDurMin] = useState(30);

  // word form
  const [word, setWord] = useState("");
  const [examplesText, setExamplesText] = useState(""); // one example per line
  const [submittingWord, setSubmittingWord] = useState(false);

  // word bank
  const [wordBankWords, setWordBankWords] = useState([]);
  const [wordBankLoading, setWordBankLoading] = useState(false);
  const [wbFilterMode, setWbFilterMode] = useState("week"); // day | week | month | custom | all
  const [wbCustomStart, setWbCustomStart] = useState(""); // YYYY-MM-DD
  const [wbCustomEnd, setWbCustomEnd] = useState(""); // YYYY-MM-DD
  const [hoveredWordId, setHoveredWordId] = useState(null);

  // topics
  const [topics, setTopics] = useState([]);
  const [topicName, setTopicName] = useState("");
  const [submittingTopic, setSubmittingTopic] = useState(false);
  const [topicsLoading, setTopicsLoading] = useState(false);

  async function refreshSessions() {
    try {
      const res = await fetch(`${API}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refreshSessions();
  }, []);

  useEffect(() => {
    refreshTopics();
  }, []);

  // ticking clock while session is running
  useEffect(() => {
    if (page === "session" && sessionStartMs && !sessionEnded) {
      const id = setInterval(() => setNowMs(Date.now()), 1000);
      return () => clearInterval(id);
    }
  }, [page, sessionStartMs, sessionEnded]);

  function formatDurationMs(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }

  async function refreshTopics() {
    setTopicsLoading(true);
    try {
      const res = await fetch(`${API}/topics`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTopicsLoading(false);
    }
  }

  async function submitTopic(e) {
    e.preventDefault();
    const name = (topicName || "").trim();
    if (!name) {
      alert("Please enter a topic.");
      return;
    }
    setSubmittingTopic(true);
    try {
      const res = await fetch(`${API}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setTopicName("");
        await refreshTopics();
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to add topic: " + JSON.stringify(err));
      }
    } catch (e) {
      alert("Failed to add topic: " + e.message);
    } finally {
      setSubmittingTopic(false);
    }
  }

  const elapsedMs = sessionStartMs ? ((sessionEndMs ?? nowMs) - sessionStartMs) : 0;

  function startSession() {
    setSessionStartMs(Date.now());
    setSessionEndMs(null);
    setSessionEnded(false);
    setSessionWords([]);
    setPage("session");
  }

  function goHome() {
    setPage("home");
    setSessionStartMs(null);
    setSessionEndMs(null);
    setSessionEnded(false);
    setSessionWords([]);
  }

  async function endSession() {
    if (!sessionStartMs) {
      goHome();
      return;
    }
    const elapsedMin = Math.max(1, Math.round((Date.now() - sessionStartMs) / 60000));
    const today = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch(`${API}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, duration: elapsedMin }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Failed to save session: " + JSON.stringify(err));
      }
    } catch (e) {
      alert("Failed to save session: " + e.message);
    } finally {
      setSessionEndMs(Date.now());
      setSessionEnded(true);
      await refreshSessions();
      // stay on session page and show summary on the right
    }
  }

  async function quickLogSession(e) {
    e.preventDefault();
    const today = new Date().toISOString().slice(0, 10);
    try {
      const dur = Math.max(1, Number(quickDurMin));
      const res = await fetch(`${API}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, duration: dur }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert("Failed to save session: " + JSON.stringify(err));
        return;
      }
      setQuickDurMin(30);
      await refreshSessions();
    } catch (e) {
      alert("Failed to save session: " + e.message);
    }
  }

  async function submitWord(e) {
    e.preventDefault();
    const examples = examplesText
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (!word.trim() || examples.length === 0) {
      alert("Please enter a word and at least one example.");
      return;
    }
    setSubmittingWord(true);
    try {
      const res = await fetch(`${API}/words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.trim(), examples }),
      });
      if (res.ok) {
        const data = await res.json();
        setWord("");
        setExamplesText("");
        if (page === "session" && !sessionEnded && data && data.id) {
          setSessionWords((prev) => [{ id: data.id, word: data.word, date: data.date, examples: data.examples }, ...prev]);
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert("Failed to add word: " + JSON.stringify(err));
      }
    } catch (e) {
      alert("Failed to add word: " + e.message);
    } finally {
      setSubmittingWord(false);
    }
  }

  // --- Word Bank helpers ---
  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function isoNDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  }

  // Aggregate total minutes per day for the last N days (including today), newest first
  function aggregateSessionsLastNDays(numDays) {
    const totalsByDate = new Map();
    for (const s of sessions) {
      const key = s.date;
      const dur = Number(s.duration) || 0;
      totalsByDate.set(key, (totalsByDate.get(key) || 0) + dur);
    }
    const result = [];
    for (let i = 0; i < numDays; i++) {
      const day = isoNDaysAgo(i);
      result.push({ date: day, minutes: totalsByDate.get(day) || 0 });
    }
    return result; // [today, yesterday, ...]
  }

  function currentRangeFromMode(mode) {
    if (mode === "all") return { start: null, end: null };
    if (mode === "day") {
      const t = todayIso();
      return { start: t, end: t };
    }
    if (mode === "week") {
      // last 7 days including today
      return { start: isoNDaysAgo(6), end: todayIso() };
    }
    if (mode === "month") {
      // last 30 days including today
      return { start: isoNDaysAgo(29), end: todayIso() };
    }
    if (mode === "custom") {
      if (wbCustomStart && wbCustomEnd) return { start: wbCustomStart, end: wbCustomEnd };
      return { start: null, end: null };
    }
    return { start: null, end: null };
  }

  async function refreshWordBank() {
    const { start, end } = currentRangeFromMode(wbFilterMode);
    let url = `${API}/words`;
    const params = [];
    if (start) params.push(`start=${encodeURIComponent(start)}`);
    if (end) params.push(`end=${encodeURIComponent(end)}`);
    if (params.length > 0) url += `?${params.join("&")}`;
    setWordBankLoading(true);
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWordBankWords(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWordBankLoading(false);
    }
  }

  useEffect(() => {
    if (page === "wordBank") {
      if (wbFilterMode === "custom") {
        if (wbCustomStart && wbCustomEnd) {
          refreshWordBank();
        }
      } else {
        refreshWordBank();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, wbFilterMode]);

  useEffect(() => {
    if (page === "wordBank" && wbFilterMode === "custom" && wbCustomStart && wbCustomEnd) {
      refreshWordBank();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wbCustomStart, wbCustomEnd]);

  if (page === "home") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: 16, fontFamily: "sans-serif", padding: "1rem" }}>
        <div style={{ width: "100%", maxWidth: 480 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: "1rem" }}>
            <button onClick={startSession} style={{ fontSize: 24, padding: "1rem 2rem" }}>Start Session</button>
            <button onClick={() => setPage("wordBank")} style={{ fontSize: 24, padding: "1rem 2rem" }}>Word Bank</button>
          </div>
          <div style={{ width: "100%", padding: 12, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Quick Add</h3>
            <form onSubmit={quickLogSession} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <label>
                Duration (min):{" "}
                <input
                  type="number"
                  value={quickDurMin}
                  onChange={(e) => setQuickDurMin(e.target.value)}
                  min={1}
                  max={1440}
                  required
                  style={{ width: 100 }}
                />
              </label>
              <button type="submit">Log</button>
            </form>
            <form onSubmit={submitWord}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Word"
                  required
                  style={{ flex: 1, padding: 8, fontSize: 16 }}
                />
              </div>
              <div style={{ marginBottom: 8 }}>
                <textarea
                  value={examplesText}
                  onChange={(e) => setExamplesText(e.target.value)}
                  placeholder={"Examples (one per line)"}
                  rows={3}
                  style={{ width: "100%", padding: 8, fontSize: 14 }}
                />
              </div>
              <button type="submit" disabled={submittingWord}>Add Word</button>
            </form>
          </div>
          <div style={{ width: "100%", marginTop: 12 }}>
            <h3 style={{ textAlign: "center" }}>Past Week (min/day)</h3>
            <ul style={{ paddingLeft: 18 }}>
              {aggregateSessionsLastNDays(7).map((d) => (
                <li key={d.date} style={{ marginBottom: 6, textAlign: "left" }}>
                  <strong>{d.date}</strong> – {d.minutes} min
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ width: 360, padding: 12, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Add Topic</h3>
          <AddTopicForm
            topicName={topicName}
            setTopicName={setTopicName}
            submitting={submittingTopic}
            onSubmit={submitTopic}
          />
          <h3 style={{ marginTop: 16, marginBottom: 8 }}>Topics</h3>
          <TopicList topics={topics} loading={topicsLoading} />
        </div>
      </div>
    );
  }

  if (page === "wordBank") {
    return (
      <div style={{ minHeight: "100vh", padding: "1.5rem", fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <button onClick={() => setPage("home")} style={{ padding: "0.5rem 0.75rem" }}>Back</button>
          <h2 style={{ margin: 0 }}>Word Bank</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label>
            <select value={wbFilterMode} onChange={(e) => setWbFilterMode(e.target.value)} style={{ padding: 6 }}>
              <option value="day">Past day</option>
              <option value="week">Past week</option>
              <option value="month">Past month</option>
              <option value="custom">Custom range</option>
              <option value="all">All</option>
            </select>
          </label>
          {wbFilterMode === "custom" && (
            <>
              <input type="date" value={wbCustomStart} onChange={(e) => setWbCustomStart(e.target.value)} />
              <span>to</span>
              <input type="date" value={wbCustomEnd} onChange={(e) => setWbCustomEnd(e.target.value)} />
            </>
          )}
        </div>
        <div>
          {wordBankLoading ? (
            <p>Loading...</p>
          ) : wordBankWords.length === 0 ? (
            <p>No words.</p>
          ) : (
            <ul style={{ paddingLeft: 18 }}>
              {wordBankWords.map((w) => (
                <li
                  key={w.id}
                  onMouseEnter={() => setHoveredWordId(w.id)}
                  onMouseLeave={() => setHoveredWordId(null)}
                  style={{ marginBottom: 10 }}
                >
                  <strong>{w.word}</strong>
                  {hoveredWordId === w.id && w.examples && w.examples.length > 0 && (
                    <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                      {w.examples.map((ex, idx) => (
                        <li key={idx} style={{ color: "#444" }}>{ex}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "row", fontFamily: "sans-serif" }}>
      <div style={{ width: 320, borderRight: "1px solid #eee", padding: "1rem" }}>
        <button onClick={endSession} disabled={sessionEnded} style={{ width: "100%,", padding: "0.75rem", fontSize: 18, marginBottom: "1rem" }}>{sessionEnded ? "Session Ended" : "End Session"}</button>
        <button onClick={goHome} style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}>Back</button>
        <div style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
          Session started: {sessionStartMs ? new Date(sessionStartMs).toLocaleTimeString() : "-"}
        </div>
        {sessionStartMs && (
          <div style={{ color: "#222", fontSize: 18, fontVariantNumeric: "tabular-nums", marginBottom: 8 }}>
            Elapsed: {formatDurationMs(elapsedMs)}
          </div>
        )}
        <h3 style={{ marginTop: "1.5rem" }}>Past Week (min/day)</h3>
        <ul style={{ paddingLeft: 18 }}>
          {aggregateSessionsLastNDays(7).map((d) => (
            <li key={d.date} style={{ marginBottom: 6 }}>
              <strong>{d.date}</strong> – {d.minutes} min
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, padding: "1.5rem" }}>
        {sessionEnded ? (
          <div>
            <h2 style={{ marginTop: 0 }}>Session Summary</h2>
            {sessionWords.length === 0 ? (
              <p>No words added this session.</p>
            ) : (
              <ul style={{ paddingLeft: 18 }}>
                {sessionWords.map((w) => (
                  <li key={w.id} style={{ marginBottom: 10 }}>
                    <strong>{w.word}</strong>
                    {w.examples && w.examples.length > 0 && (
                      <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                        {w.examples.map((ex, idx) => (
                          <li key={idx} style={{ color: "#444" }}>{ex}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ marginTop: 0 }}>Add New Word</h2>
            <form onSubmit={submitWord} style={{ maxWidth: 640 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value)}
                  placeholder="Word"
                  required
                  style={{ flex: 1, padding: 8, fontSize: 16 }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <textarea
                  value={examplesText}
                  onChange={(e) => setExamplesText(e.target.value)}
                  placeholder={"Examples (one per line)"}
                  rows={8}
                  style={{ width: "100%", padding: 8, fontSize: 14 }}
                />
              </div>
              <button type="submit" disabled={submittingWord} style={{ padding: "0.6rem 1rem", fontSize: 16 }}>
                {submittingWord ? "Adding..." : "Add"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
