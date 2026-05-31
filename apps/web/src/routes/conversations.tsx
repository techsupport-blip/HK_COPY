import { Link } from "@tanstack/react-router";
import { useConversations } from "@hearth/client";

export function ConversationsPage() {
  const conversations = useConversations();

  if (conversations.isLoading) {
    return <div className="center-state">Loading chats…</div>;
  }
  const list = conversations.data ?? [];

  return (
    <div style={{ maxWidth: 620, margin: "0 auto" }}>
      <h1 className="title">Your chats</h1>
      <p className="subtitle">These are your mutual matches. Say hi, then make a plan.</p>

      {list.length === 0 ? (
        <div className="center-state">
          No chats yet. Like someone who likes you back to start talking.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((c) => (
            <Link
              key={c.id}
              to="/chats/$conversationId"
              params={{ conversationId: c.id }}
              className="card"
              style={{ display: "flex", gap: 14, padding: 14, alignItems: "center" }}
            >
              <img
                src={c.otherPhotoUrls[0]}
                alt={c.otherDisplayName}
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover" }}
              />
              <div>
                <div style={{ fontWeight: 700 }}>{c.otherDisplayName}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {c.lastMessageAt
                    ? `Active ${new Date(c.lastMessageAt).toLocaleDateString()}`
                    : "New match — start the conversation"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
