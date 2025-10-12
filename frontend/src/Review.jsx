import { useEffect, useMemo, useState } from "react";

const API = import.meta.env.VITE_API_URL || "/api";

export default function Review({ onBack }) {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [mode, setMode] = useState("random_all"); // random_all | reverse_chrono | yesterday | last_week | last_month
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth <= 768 : false);

  const [reviewStartMs, setReviewStartMs] = useState(null);
  const [reviewEndMs, setReviewEndMs] = useState(null);
  const [reviewEnded, setReviewEnded] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    setReviewStartMs(Date.now());
  }, []);

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth <= 768);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (reviewStartMs && !reviewEnded) {
      const id = setInterval(() => setNowMs(Date.now()), 1000);
      return () => clearInterval(id);
    }
  }, [reviewStartMs, reviewEnded]);

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

  function localYmd(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function todayIso() {
    return localYmd();
  }

  function isoNDaysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return localYmd(d);
  }

  function shuffleIndexes(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function shouldShuffle(m) {
    return m === "random_all" || m === "yesterday" || m === "last_week" || m === "last_month";
  }

  async function fetchWordsForMode(m) {
    setLoading(true);
    try {
      let url = `${API}/words`;
      const params = [];
      if (m === "yesterday") {
        const y = isoNDaysAgo(1);
        params.push(`start=${encodeURIComponent(y)}`);
        params.push(`end=${encodeURIComponent(y)}`);
      } else if (m === "last_week") {
        params.push(`start=${encodeURIComponent(isoNDaysAgo(6))}`);
        params.push(`end=${encodeURIComponent(todayIso())}`);
      } else if (m === "last_month") {
        params.push(`start=${encodeURIComponent(isoNDaysAgo(29))}`);
        params.push(`end=${encodeURIComponent(todayIso())}`);
      }
      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setWords(data);
        if (shouldShuffle(m)) {
          setOrder(shuffleIndexes(data.length));
        } else {
          // reverse_chrono uses API's default order (newest first)
          setOrder(Array.from({ length: data.length }, (_, i) => i));
        }
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWordsForMode(mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const elapsedMs = reviewStartMs ? ((reviewEndMs ?? nowMs) - reviewStartMs) : 0;

  const currentWord = useMemo(() => {
    if (!order || order.length === 0) return null;
    const idx = order[currentIndex];
    return words[idx] || null;
  }, [order, currentIndex, words]);

  function nextWord() {
    if (!order || order.length === 0) return;
    const next = currentIndex + 1;
    if (next >= order.length) {
      if (shouldShuffle(mode)) {
        // Re-shuffle for continuous review on random modes
        setOrder(shuffleIndexes(words.length));
        setCurrentIndex(0);
      } else {
        // Loop back to newest
        setCurrentIndex(0);
      }
    } else {
      setCurrentIndex(next);
    }
    setShowHint(false);
  }

  async function endReview() {
    const end = Date.now();
    setReviewEndMs(end);
    setReviewEnded(true);
    if (!reviewStartMs) return;
    const elapsedMin = Math.max(1, Math.round((end - reviewStartMs) / 60000));
    const today = localYmd();
    try {
      const res = await fetch(`${API}/review_sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, duration: elapsedMin }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // non-blocking alert
        // eslint-disable-next-line no-alert
        alert("Failed to save review: " + JSON.stringify(err));
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert("Failed to save review: " + e.message);
    }
  }

  const containerStyle = { minHeight: "100vh", display: "flex", flexDirection: isMobile ? "column" : "row", fontFamily: "sans-serif" };
  const sidebarStyle = { width: isMobile ? "100%" : 320, borderRight: isMobile ? "none" : "1px solid #eee", borderBottom: isMobile ? "1px solid #eee" : "none", padding: isMobile ? "0.75rem 1rem" : "1rem", position: isMobile ? "sticky" : "static", top: 0, background: isMobile ? "#fff" : undefined, zIndex: 1 };
  const contentStyle = { flex: 1, padding: isMobile ? "1rem" : "1.5rem" };
  const primaryBtnStyle = { width: isMobile ? "auto" : "100%", padding: isMobile ? "0.5rem 0.75rem" : "0.75rem", fontSize: isMobile ? 16 : 18, marginBottom: isMobile ? 0 : "1rem" };
  const secondaryBtnStyle = { width: isMobile ? "auto" : "100%", padding: isMobile ? "0.5rem 0.75rem" : "0.5rem", marginBottom: isMobile ? 0 : "1rem" };

  return (
    <div style={containerStyle}>
      <div style={sidebarStyle}>
        {isMobile ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 6 }}>
            <button onClick={endReview} disabled={reviewEnded} style={primaryBtnStyle}>{reviewEnded ? "Session Ended" : "End Session"}</button>
            <button onClick={onBack} style={secondaryBtnStyle}>Back</button>
          </div>
        ) : (
          <>
            <button onClick={endReview} disabled={reviewEnded} style={primaryBtnStyle}>{reviewEnded ? "Session Ended" : "End Session"}</button>
            <button onClick={onBack} style={secondaryBtnStyle}>Back</button>
          </>
        )}
        <div style={{ color: "#666", fontSize: isMobile ? 12 : 14, marginBottom: 6 }}>
          Review started: {reviewStartMs ? new Date(reviewStartMs).toLocaleTimeString() : "-"}
        </div>
        {reviewStartMs && (
          <div style={{ color: "#222", fontSize: isMobile ? 16 : 18, fontVariantNumeric: "tabular-nums", marginBottom: isMobile ? 4 : 8 }}>
            Elapsed: {formatDurationMs(elapsedMs)}
          </div>
        )}
      </div>
      <div style={contentStyle}>
        <h2 style={{ marginTop: 0 }}>Word Review</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ padding: 6 }}>
              <option value="random_all">Random</option>
              <option value="reverse_chrono">Reverse chronological</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_week">Last week</option>
              <option value="last_month">Last month</option>
            </select>
          </label>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : !currentWord ? (
          <p>No words available.</p>
        ) : (
          <div>
            <div style={{ fontSize: isMobile ? 32 : 36, marginBottom: 16, textAlign: "center" }}>
              <strong>{currentWord.word}</strong>
            </div>
            {showHint && currentWord.examples && currentWord.examples.length > 0 && (
              <ul style={{ paddingLeft: 18, marginTop: 4, marginBottom: 16, lineHeight: 1.5 }}>
                {currentWord.examples.map((ex, idx) => (
                  <li key={idx} style={{ color: "#444" }}>{ex}</li>
                ))}
              </ul>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: isMobile ? "center" : "flex-start" }}>
              <button onClick={() => setShowHint(true)} disabled={reviewEnded} style={{ padding: isMobile ? "0.5rem 0.75rem" : "0.5rem 1rem" }}>Hint</button>
              <button onClick={nextWord} disabled={reviewEnded} style={{ padding: isMobile ? "0.5rem 0.75rem" : "0.5rem 1rem" }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


