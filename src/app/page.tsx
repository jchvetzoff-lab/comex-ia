"use client";
import { useState, useRef, useEffect } from "react";

const AGENTS = [
  { id: "ceo", name: "Alexandre", fullName: "Alexandre Dumont", title: "CEO / Directeur General", emoji: "👔", color: "#e94e1b", skills: ["Strategie", "Priorisation", "Levee de fonds", "OKR"] },
  { id: "cfo", name: "Marie-Claire", fullName: "Marie-Claire Beaumont", title: "CFO / Directrice Financiere", emoji: "📊", color: "#3b82f6", skills: ["Unit economics", "Pricing", "Cash flow", "Fiscalite"] },
  { id: "cto", name: "Thomas", fullName: "Thomas Renard", title: "CTO / Directeur Technique", emoji: "⚙️", color: "#10b981", skills: ["Architecture", "IA/ML", "DevOps", "Performance"] },
  { id: "marketing", name: "Camille", fullName: "Camille Leroy", title: "Directrice Marketing", emoji: "📈", color: "#f59e0b", skills: ["Growth", "SEO/GEO", "Ads", "Funnels"] },
  { id: "artistique", name: "Lucas", fullName: "Lucas Moreau", title: "Directeur Artistique", emoji: "🎨", color: "#8b5cf6", skills: ["Branding", "UI/UX", "Typo", "Motion"] },
  { id: "communication", name: "Sophie", fullName: "Sophie Delacroix", title: "Directrice Communication", emoji: "📣", color: "#ec4899", skills: ["Storytelling", "RP", "Copywriting", "Events"] },
];

type Message = { role: "user" | "assistant"; content: string; agent?: string };

export default function Home() {
  const [tab, setTab] = useState<"chat" | "comex" | "team">("chat");
  const [selected, setSelected] = useState(0);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [comexQ, setComexQ] = useState("");
  const [comexResults, setComexResults] = useState<{ id: string; text: string }[]>([]);
  const [comexLoading, setComexLoading] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const agent = AGENTS[selected];
  const agentMessages = messages[agent.id] || [];

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [agentMessages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    const newMsgs: Message[] = [...agentMessages, { role: "user", content: msg }];
    setMessages((m) => ({ ...m, [agent.id]: newMsgs }));
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agent.id, message: msg, history: newMsgs.slice(-10) }),
      });
      const data = await res.json();
      setMessages((m) => ({
        ...m,
        [agent.id]: [...(m[agent.id] || []), { role: "user", content: msg }, { role: "assistant", content: data.text, agent: agent.id }],
      }));
    } catch {
      setMessages((m) => ({
        ...m,
        [agent.id]: [...(m[agent.id] || []), { role: "user", content: msg }, { role: "assistant", content: "Erreur de connexion.", agent: agent.id }],
      }));
    }
    setLoading(false);
  }

  async function runComex() {
    if (!comexQ.trim() || comexLoading) return;
    setComexResults([]);
    for (const ag of AGENTS) {
      setComexLoading(ag.id);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ agent: ag.id, message: comexQ }),
        });
        const data = await res.json();
        setComexResults((r) => [...r, { id: ag.id, text: data.text }]);
      } catch {
        setComexResults((r) => [...r, { id: ag.id, text: "Erreur de connexion." }]);
      }
    }
    setComexLoading(null);
  }

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      {/* Header */}
      <div className="header">
        <h1>COMEX</h1>
        <p>Comite de Direction IA — 6 experts a votre service</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>💬 Consulter</div>
        <div className={`tab ${tab === "comex" ? "active" : ""}`} onClick={() => setTab("comex")}>🏛️ Reunion COMEX</div>
        <div className={`tab ${tab === "team" ? "active" : ""}`} onClick={() => setTab("team")}>👥 L&apos;equipe</div>
      </div>

      {/* Agent Cards */}
      <div className="agent-grid">
        {AGENTS.map((ag, i) => (
          <div
            key={ag.id}
            className={`agent-card ${tab === "chat" && selected === i ? "active" : ""}`}
            onClick={() => { setSelected(i); if (tab !== "chat") setTab("chat"); }}
            style={tab === "chat" && selected === i ? { borderColor: ag.color } : {}}
          >
            <div className="dot" />
            <div className="emoji">{ag.emoji}</div>
            <div className="name" style={{ color: ag.color }}>{ag.name}</div>
            <div className="role">{ag.title.split("/")[0].trim()}</div>
          </div>
        ))}
      </div>

      {/* Chat Mode */}
      {tab === "chat" && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="emoji">{agent.emoji}</div>
            <div className="info">
              <div className="name" style={{ color: agent.color }}>{agent.fullName}</div>
              <div className="role">{agent.title}</div>
            </div>
            <div className="status"><div className="dot" /> En ligne</div>
          </div>
          <div className="messages">
            {agentMessages.length === 0 && (
              <div style={{ textAlign: "center", color: "#555", padding: "40px 20px", fontSize: 14 }}>
                Posez votre question a {agent.fullName}...
              </div>
            )}
            {agentMessages.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === "assistant" && (
                  <div className="agent-label" style={{ color: agent.color }}>{agent.emoji} {agent.fullName}</div>
                )}
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="thinking">
                {agent.emoji} {agent.fullName} reflechit
                <div className="dots"><span>.</span><span>.</span><span>.</span></div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>
          <div className="msg-input-row">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Message a ${agent.fullName}...`}
              rows={1}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>Envoyer</button>
          </div>
        </div>
      )}

      {/* COMEX Mode */}
      {tab === "comex" && (
        <div className="chat-container">
          <div className="chat-header">
            <div className="emoji">🏛️</div>
            <div className="info">
              <div className="name" style={{ color: "#e94e1b" }}>Reunion du COMEX</div>
              <div className="role">Les 6 experts analysent votre question</div>
            </div>
          </div>
          <div style={{ padding: 20 }}>
            <textarea
              value={comexQ}
              onChange={(e) => setComexQ(e.target.value)}
              placeholder="Quelle question strategique souhaitez-vous soumettre au COMEX ?"
              style={{
                width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                borderRadius: 12, padding: "14px 18px", color: "var(--text)",
                fontFamily: "inherit", fontSize: 14, resize: "none", outline: "none", minHeight: 80,
              }}
            />
            <button
              onClick={runComex}
              disabled={!!comexLoading || !comexQ.trim()}
              style={{
                marginTop: 12, background: "linear-gradient(135deg, #e94e1b, #ff8c42)",
                border: "none", borderRadius: 12, padding: "12px 32px",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                opacity: comexLoading ? 0.4 : 1,
              }}
            >
              {comexLoading ? "Reunion en cours..." : "Lancer la reunion"}
            </button>
          </div>
          {(comexResults.length > 0 || comexLoading) && (
            <div className="comex-responses">
              {comexResults.map((r) => {
                const ag = AGENTS.find((a) => a.id === r.id)!;
                return (
                  <div key={r.id} className="comex-card">
                    <div className="card-header">
                      <div className="emoji">{ag.emoji}</div>
                      <div>
                        <div className="name" style={{ color: ag.color }}>{ag.fullName}</div>
                        <div className="role">{ag.title}</div>
                      </div>
                    </div>
                    <div className="card-body">{r.text}</div>
                  </div>
                );
              })}
              {comexLoading && (
                <div className="thinking" style={{ margin: "0 auto" }}>
                  {AGENTS.find((a) => a.id === comexLoading)?.emoji}{" "}
                  {AGENTS.find((a) => a.id === comexLoading)?.fullName} prend la parole
                  <div className="dots"><span>.</span><span>.</span><span>.</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Team Mode */}
      {tab === "team" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {AGENTS.map((ag) => (
            <div key={ag.id} className="comex-card" style={{ cursor: "pointer" }} onClick={() => { setSelected(AGENTS.indexOf(ag)); setTab("chat"); }}>
              <div className="card-header">
                <div className="emoji" style={{ fontSize: 40 }}>{ag.emoji}</div>
                <div>
                  <div className="name" style={{ color: ag.color, fontSize: 20 }}>{ag.fullName}</div>
                  <div className="role" style={{ fontSize: 13 }}>{ag.title}</div>
                </div>
              </div>
              <div className="skills">
                {ag.skills.map((s) => <span key={s} className="skill">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
