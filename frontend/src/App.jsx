import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "/api";


function App() {
  const [page, setPage] = useState("home");
  const [sessions, setSessions] = useState([]);
  const [sessionStartMs, setSessionStartMs] = useState(null);

  // word form
  const [word, setWord] = useState("");
  const [examplesText, setExamplesText] = useState(""); // one example per line
  const [submittingWord, setSubmittingWord] = useState(false);

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

  function startSession() {
    setSessionStartMs(Date.now());
    setPage("session");
  }

  async function endSession() {
    if (!sessionStartMs) {
      setPage("home");
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
      setSessionStartMs(null);
      await refreshSessions();
      setPage("home");
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
        setWord("");
        setExamplesText("");
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

  if (page === "home") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <button onClick={startSession} style={{ fontSize: 24, padding: "1rem 2rem" }}>Start Session</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "row", fontFamily: "sans-serif" }}>
      <div style={{ width: 320, borderRight: "1px solid #eee", padding: "1rem" }}>
        <button onClick={endSession} style={{ width: "100%", padding: "0.75rem", fontSize: 18, marginBottom: "1rem" }}>End Session</button>
        <button onClick={() => setPage("home")} style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}>Back</button>
        <div style={{ color: "#666", fontSize: 14, marginBottom: 8 }}>
          Session started: {sessionStartMs ? new Date(sessionStartMs).toLocaleTimeString() : "-"}
        </div>
        <h3 style={{ marginTop: "1.5rem" }}>Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p style={{ color: "#555" }}>No sessions yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {sessions.slice(0, 7).map((s, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                <strong>{s.date}</strong> – {s.duration} min
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ flex: 1, padding: "1.5rem" }}>
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
    </div>
  );
}

export default App;
