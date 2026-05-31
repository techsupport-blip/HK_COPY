import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import {
  useMessages,
  useSendMessage,
  useWingman,
} from "@hearth/client";

export function ChatPage() {
  const { conversationId } = useParams({ strict: false }) as {
    conversationId: string;
  };
  const navigate = useNavigate();
  const messages = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const wingman = useWingman(conversationId);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const list = messages.data ?? [];
  const isEmpty = !messages.isLoading && list.length === 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [list.length]);

  async function submit() {
    const content = input.trim();
    if (!content) return;
    setInput("");
    setSuggestions([]);
    await send.mutateAsync(content);
  }

  async function askWingman() {
    // Openers when the thread is empty, otherwise reply assist.
    const res = isEmpty
      ? await wingman.openers.mutateAsync()
      : await wingman.assist.mutateAsync();
    setSuggestions(res.suggestions);
  }

  const wingmanBusy = wingman.openers.isPending || wingman.assist.isPending;

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <div
        className="link"
        style={{ marginBottom: 14, cursor: "pointer" }}
        onClick={() => navigate({ to: "/chats" })}
      >
        ← All chats
      </div>

      <div className="thread">
        {list.map((m) => (
          <div key={m.id} className={`bubble ${m.mine ? "me" : "them"}`}>
            {m.content}
          </div>
        ))}
        {isEmpty && (
          <div className="center-state">
            You matched! Break the ice — your wingman can help. 👇
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="wingman-panel">
          <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>
            🔥 WINGMAN SUGGESTS — tap to use
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="wingman-chip"
              onClick={() => {
                setInput(s);
                setSuggestions([]);
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="composer">
        <button
          className="btn btn-ghost"
          onClick={askWingman}
          disabled={wingmanBusy}
          title="Ask your wingman"
        >
          {wingmanBusy ? "…" : "🔥"}
        </button>
        <input
          className="input"
          value={input}
          placeholder="Message…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button className="btn btn-primary" onClick={submit} disabled={!input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
