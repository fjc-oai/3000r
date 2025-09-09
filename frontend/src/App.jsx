import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "/api";


function App() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [durMin, setDurMin] = useState(30);
  const [sessions, setSessions] = useState([]);

  // fetch all sessions
  async function refreshSessions() {
    const res = await fetch(`${API}/sessions`);
    if (res.ok) {
      const data = await res.json();
      setSessions(data);
    }
  }

  useEffect(() => {
    refreshSessions();
  }, []);

  // add a new session
  async function addSession(e) {
    e.preventDefault();
    const res = await fetch(`${API}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, duration: Number(durMin) }),
    });
    if (res.ok) {
      setDurMin(30);
      setDate(new Date().toISOString().slice(0, 10));
      refreshSessions();
    } else {
      const err = await res.json();
      alert("Error: " + JSON.stringify(err));
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>3000r – Study Sessions</h1>

      <form onSubmit={addSession} style={{ marginBottom: "1rem" }}>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Date:{" "}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <label>
            Duration (minutes):{" "}
            <input
              type="number"
              value={durMin}
              onChange={(e) => setDurMin(e.target.value)}
              min="1"
              max="1440"
              required
            />
          </label>
        </div>
        <button type="submit">Add Session</button>
      </form>

      <h2>All Sessions</h2>
      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <ul>
          {sessions.map((s, i) => (
            <li key={i}>
              <strong>{s.date}</strong> – {s.duration} min
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
