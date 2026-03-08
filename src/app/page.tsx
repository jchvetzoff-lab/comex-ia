"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const AGENTS = [
  { id: "ceo", name: "Alexandre", fullName: "Alexandre Dumont", title: "CEO", emoji: "👔", color: "#e94e1b", skills: ["Strategie", "OKR/ICE", "PMF", "Kill/Pivot"] },
  { id: "cfo", name: "Marie-Claire", fullName: "Marie-Claire Beaumont", title: "CFO", emoji: "📊", color: "#3b82f6", skills: ["Unit Economics", "Pricing", "Fiscalite", "DCF"] },
  { id: "cto", name: "Thomas", fullName: "Thomas Renard", title: "CTO", emoji: "⚙️", color: "#10b981", skills: ["Architecture", "IA/ML", "DevOps", "Security"] },
  { id: "marketing", name: "Camille", fullName: "Camille Leroy", title: "Dir. Marketing", emoji: "📈", color: "#f59e0b", skills: ["Growth AARRR", "SEO/GEO", "Ads", "Funnels"] },
  { id: "artistique", name: "Lucas", fullName: "Lucas Moreau", title: "Dir. Artistique", emoji: "🎨", color: "#8b5cf6", skills: ["Design System", "UI/UX", "Branding", "Motion"] },
  { id: "communication", name: "Sophie", fullName: "Sophie Delacroix", title: "Dir. Comm", emoji: "📣", color: "#ec4899", skills: ["StoryBrand", "RP/Presse", "Copywriting", "LinkedIn"] },
];

type AgentResponse = { id: string; text: string; loading: boolean };
type HistoryEntry = { question: string; responses: AgentResponse[]; timestamp: number; deepResearch: boolean };

const STORAGE_KEY = "comex-ia-history";
const MAX_HISTORY = 50;

function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHistory(h: HistoryEntry[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(0, MAX_HISTORY))); } catch {}
}

function getRecentContext(history: HistoryEntry[]): { role: string; content: string }[] {
  const recent = history.slice(0, 3);
  const ctx: { role: string; content: string }[] = [];
  for (const entry of recent.reverse()) {
    ctx.push({ role: "user", content: entry.question });
    const summary = entry.responses.map(r => {
      const ag = AGENTS.find(a => a.id === r.id);
      return `[${ag?.name || r.id}]: ${r.text.slice(0, 300)}...`;
    }).join("\n");
    ctx.push({ role: "assistant", content: summary });
  }
  return ctx;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set(AGENTS.map(a => a.id)));
  const [input, setInput] = useState("");
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [deepResearch, setDeepResearch] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (historyLoaded) saveHistory(history);
  }, [history, historyLoaded]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses, running]);

  function toggleAgent(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) { if (next.size > 1) next.delete(id); }
      else next.add(id);
      return next;
    });
  }

  function selectAll() { setSelected(new Set(AGENTS.map(a => a.id))); }
  function selectNone() { setSelected(new Set([AGENTS[0].id])); }

  const launch = useCallback(async () => {
    if (!input.trim() || running) return;
    const question = input.trim();
    setInput("");
    setRunning(true);

    const activeAgents = AGENTS.filter(a => selected.has(a.id));
    const initialResponses = activeAgents.map(a => ({ id: a.id, text: "", loading: true }));
    setResponses(initialResponses);

    const recentCtx = getRecentContext(history);

    const promises = activeAgents.map(async (ag) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent: ag.id,
            message: question,
            history: recentCtx,
            deepResearch,
          }),
        });
        const data = await res.json();
        setResponses(prev => prev.map(r => r.id === ag.id ? { ...r, text: data.text, loading: false } : r));
      } catch {
        setResponses(prev => prev.map(r => r.id === ag.id ? { ...r, text: "Erreur de connexion.", loading: false } : r));
      }
    });

    await Promise.all(promises);
    setRunning(false);

    setResponses(prev => {
      const entry: HistoryEntry = { question, responses: prev, timestamp: Date.now(), deepResearch };
      setHistory(h => [entry, ...h]);
      return prev;
    });
  }, [input, running, selected, history, deepResearch]);

  function clearHistory() {
    if (confirm("Effacer tout l'historique ?")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div className="header">
        <h1>COMEX IA</h1>
        <p>Votre comité de direction augmenté — recherche web + RAG projets + mémoire</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
          <span className="badge-feature">🔍 Web Search</span>
          <span className="badge-feature">📚 RAG Documents</span>
          <span className="badge-feature">🧠 Mémoire</span>
          <span className="badge-feature">📖 Sources</span>
        </div>
      </div>

      {/* Agent Selection */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>
            EQUIPE ({selected.size}/{AGENTS.length} actifs)
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={selectAll} className="small-btn">Tous</button>
            <button onClick={selectNone} className="small-btn">Reset</button>
          </div>
        </div>
        <div className="agent-grid">
          {AGENTS.map((ag) => {
            const active = selected.has(ag.id);
            return (
              <div
                key={ag.id}
                className={`agent-card ${active ? "active" : "inactive"}`}
                onClick={() => toggleAgent(ag.id)}
                style={active ? { borderColor: ag.color } : {}}
              >
                {active && <div className="dot" />}
                {!active && <div className="dot-off" />}
                <div className="emoji">{ag.emoji}</div>
                <div className="name" style={{ color: active ? ag.color : "#555" }}>{ag.name}</div>
                <div className="role">{ag.title}</div>
                <div className="skills">
                  {ag.skills.map(s => <span key={s} className="skill">{s}</span>)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Input */}
      <div className="input-zone">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); launch(); } }}
          placeholder="Votre question stratégique..."
          rows={3}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Deep Research Toggle */}
          <label className="toggle-label" onClick={() => setDeepResearch(!deepResearch)}>
            <div className={`toggle-track ${deepResearch ? "toggle-on" : ""}`}>
              <div className="toggle-thumb" />
            </div>
            <span style={{ fontSize: 13, color: deepResearch ? "#f59e0b" : "#888" }}>
              {deepResearch ? "🔬 Recherche approfondie" : "⚡ Mode rapide"}
            </span>
          </label>

          <button onClick={launch} disabled={running || !input.trim()} className="launch-btn">
            {running ? (
              <><span className="spinner" /> Analyse en cours...</>
            ) : (
              <>Lancer ({selected.size} expert{selected.size > 1 ? "s" : ""}){deepResearch ? " 🔬" : ""}</>
            )}
          </button>
        </div>
      </div>

      {/* Live Responses */}
      {responses.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="responses-grid">
            {responses.map((r) => {
              const ag = AGENTS.find(a => a.id === r.id)!;
              return (
                <div key={r.id} className="response-card" style={{ borderColor: r.loading ? `${ag.color}44` : ag.color }}>
                  <div className="resp-header">
                    <span style={{ fontSize: 28 }}>{ag.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, color: ag.color, fontSize: 15 }}>{ag.fullName}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{ag.title}</div>
                    </div>
                    {r.loading && <div className="thinking-badge">recherche + analyse<span className="dots"><span>.</span><span>.</span><span>.</span></span></div>}
                    {!r.loading && <div className="done-badge">✓ terminé</div>}
                  </div>
                  <div className="resp-body">
                    {r.loading ? (
                      <div className="skeleton">
                        <div className="skel-line" style={{ width: "90%" }} />
                        <div className="skel-line" style={{ width: "75%" }} />
                        <div className="skel-line" style={{ width: "85%" }} />
                        <div className="skel-line" style={{ width: "60%" }} />
                        <div className="skel-line" style={{ width: "70%" }} />
                      </div>
                    ) : (
                      r.text
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #1a1a2a", paddingBottom: 8 }}>
            <span style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>
              HISTORIQUE ({history.length} session{history.length > 1 ? "s" : ""})
            </span>
            <button onClick={clearHistory} className="small-btn" style={{ color: "#e94e1b", borderColor: "#e94e1b33" }}>
              Effacer
            </button>
          </div>
          {history.map((h, hi) => (
            <details key={hi} style={{ marginBottom: 12 }}>
              <summary className="history-summary">
                <span style={{ fontSize: 11, color: "#555", marginRight: 8 }}>{formatDate(h.timestamp)}</span>
                {h.deepResearch && <span style={{ fontSize: 10, color: "#f59e0b", marginRight: 6 }}>🔬</span>}
                {h.question}
              </summary>
              <div className="responses-grid" style={{ marginTop: 12 }}>
                {h.responses.map((r) => {
                  const ag = AGENTS.find(a => a.id === r.id)!;
                  return (
                    <div key={r.id} className="response-card" style={{ borderColor: ag.color }}>
                      <div className="resp-header">
                        <span style={{ fontSize: 24 }}>{ag.emoji}</span>
                        <div>
                          <div style={{ fontWeight: 700, color: ag.color, fontSize: 14 }}>{ag.fullName}</div>
                        </div>
                      </div>
                      <div className="resp-body">{r.text}</div>
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
