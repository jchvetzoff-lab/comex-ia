"use client";
import { useState, useRef, useEffect } from "react";

const AGENTS = [
  { id: "ceo", name: "Alexandre", fullName: "Alexandre Dumont", title: "CEO", emoji: "👔", color: "#e94e1b", skills: ["Strategie", "Priorisation", "Levee de fonds", "OKR"] },
  { id: "cfo", name: "Marie-Claire", fullName: "Marie-Claire Beaumont", title: "CFO", emoji: "📊", color: "#3b82f6", skills: ["Unit economics", "Pricing", "Cash flow", "Fiscalite"] },
  { id: "cto", name: "Thomas", fullName: "Thomas Renard", title: "CTO", emoji: "⚙️", color: "#10b981", skills: ["Architecture", "IA/ML", "DevOps", "Performance"] },
  { id: "marketing", name: "Camille", fullName: "Camille Leroy", title: "Dir. Marketing", emoji: "📈", color: "#f59e0b", skills: ["Growth", "SEO/GEO", "Ads", "Funnels"] },
  { id: "artistique", name: "Lucas", fullName: "Lucas Moreau", title: "Dir. Artistique", emoji: "🎨", color: "#8b5cf6", skills: ["Branding", "UI/UX", "Typo", "Motion"] },
  { id: "communication", name: "Sophie", fullName: "Sophie Delacroix", title: "Dir. Comm", emoji: "📣", color: "#ec4899", skills: ["Storytelling", "RP", "Copywriting", "Events"] },
];

type AgentResponse = { id: string; text: string; loading: boolean };

export default function Home() {
  const [selected, setSelected] = useState<Set<string>>(new Set(AGENTS.map(a => a.id)));
  const [input, setInput] = useState("");
  const [responses, setResponses] = useState<AgentResponse[]>([]);
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<{ question: string; responses: AgentResponse[] }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  async function launch() {
    if (!input.trim() || running) return;
    const question = input.trim();
    setInput("");
    setRunning(true);

    const activeAgents = AGENTS.filter(a => selected.has(a.id));
    const initialResponses = activeAgents.map(a => ({ id: a.id, text: "", loading: true }));
    setResponses(initialResponses);

    // Launch all agents in parallel
    const promises = activeAgents.map(async (ag) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: ag.id, message: question }),
        });
        const data = await res.json();
        setResponses(prev => prev.map(r => r.id === ag.id ? { ...r, text: data.text, loading: false } : r));
      } catch {
        setResponses(prev => prev.map(r => r.id === ag.id ? { ...r, text: "Erreur de connexion.", loading: false } : r));
      }
    });

    await Promise.all(promises);
    setRunning(false);

    // Save to history
    setResponses(prev => {
      setHistory(h => [{ question, responses: prev }, ...h]);
      return prev;
    });
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div className="header">
        <h1>COMEX</h1>
        <p>Selectionnez vos experts, posez votre question, ils bossent en parallele</p>
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
          placeholder="Votre question strategique..."
          rows={3}
        />
        <button onClick={launch} disabled={running || !input.trim()} className="launch-btn">
          {running ? (
            <><span className="spinner" /> En cours...</>
          ) : (
            <>Lancer ({selected.size} expert{selected.size > 1 ? "s" : ""})</>
          )}
        </button>
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
                    {r.loading && <div className="thinking-badge">reflechit<span className="dots"><span>.</span><span>.</span><span>.</span></span></div>}
                    {!r.loading && <div className="done-badge">termine</div>}
                  </div>
                  <div className="resp-body">
                    {r.loading ? (
                      <div className="skeleton">
                        <div className="skel-line" style={{ width: "90%" }} />
                        <div className="skel-line" style={{ width: "75%" }} />
                        <div className="skel-line" style={{ width: "85%" }} />
                        <div className="skel-line" style={{ width: "60%" }} />
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
          <div style={{ fontSize: 13, color: "#555", fontWeight: 600, marginBottom: 16, borderBottom: "1px solid #1a1a2a", paddingBottom: 8 }}>
            HISTORIQUE
          </div>
          {history.map((h, hi) => (
            <details key={hi} style={{ marginBottom: 12 }}>
              <summary className="history-summary">{h.question}</summary>
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
