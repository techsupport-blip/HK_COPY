import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useApiClient } from "@hearth/client";

interface Turn {
  role: "assistant" | "user";
  content: string;
}

export function OnboardingPage() {
  const client = useApiClient();
  const navigate = useNavigate();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      // Resume an in-progress interview, or start a fresh one.
      const state = await client.interviewState();
      if (state.status === "complete") {
        navigate({ to: "/matches" });
        return;
      }
      if (state.turns.length > 0) {
        setTurns(state.turns.map((t) => ({ role: t.role, content: t.content })));
      } else {
        const reply = await client.startInterview();
        if (reply.question) {
          setTurns([{ role: "assistant", content: reply.question }]);
        }
      }
    })().catch(() => undefined);
  }, [client, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, summary]);

  async function send() {
    const content = input.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);
    setTurns((t) => [...t, { role: "user", content }]);
    try {
      const reply = await client.submitInterviewTurn(content);
      if (reply.done) {
        setDone(true);
        setSummary(reply.tasteProfileSummary);
      } else if (reply.question) {
        setTurns((t) => [...t, { role: "assistant", content: reply.question! }]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 className="title">Let's get to know you</h1>
      <p className="subtitle">
        No forms. Just a short chat with your matchmaker — answer honestly and I'll
        find people you'd actually click with.
      </p>

      <div className="thread">
        {turns.map((t, i) => (
          <div key={i} className={`bubble ${t.role === "user" ? "me" : "them"}`}>
            {t.content}
          </div>
        ))}
        {busy && <div className="bubble them muted">…</div>}
        {done && summary && (
          <div className="rationale" style={{ alignSelf: "stretch" }}>
            <h4>Your taste profile</h4>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{summary}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {done ? (
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 16 }}
          onClick={() => navigate({ to: "/matches" })}
        >
          See my matches →
        </button>
      ) : (
        <div className="composer">
          <input
            className="input"
            value={input}
            placeholder="Type your answer…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            disabled={busy}
            autoFocus
          />
          <button className="btn btn-primary" onClick={send} disabled={busy || !input.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}
