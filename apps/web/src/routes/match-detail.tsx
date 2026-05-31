import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import type { ActivityCategory } from "@hearth/shared";
import { useActivities, useDecideMatch, useMatch, useMe } from "@hearth/client";
import { Chips } from "../components/Chips";

const CATEGORY_ICON: Record<ActivityCategory, string> = {
  coffee: "☕",
  outdoors: "🌲",
  culture: "🎨",
  food: "🍜",
  active: "🏃",
};

const BARS: { key: "interests" | "values" | "personality" | "energy"; label: string }[] = [
  { key: "interests", label: "Shared interests" },
  { key: "values", label: "Values" },
  { key: "personality", label: "Personality" },
  { key: "energy", label: "Energy" },
];

export function MatchDetailPage() {
  const { matchId } = useParams({ strict: false }) as { matchId: string };
  const navigate = useNavigate();
  const me = useMe();
  const match = useMatch(matchId);
  const activities = useActivities(matchId);
  const decide = useDecideMatch(matchId);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  if (match.isLoading) return <div className="center-state">Loading…</div>;
  if (!match.data) return <div className="center-state">Match not found.</div>;
  const m = match.data;
  const myInterests = new Set(
    (me.data?.profile.interests ?? []).map((i) => i.toLowerCase()),
  );

  async function act(decision: "like" | "pass") {
    const res = await decide.mutateAsync(decision);
    if (decision === "pass") {
      navigate({ to: "/matches" });
    } else if (res.mutual && res.conversationId) {
      // Celebrate the mutual match before dropping into the chat.
      setCelebrate(res.conversationId);
    }
  }

  return (
    <div>
      {celebrate && (
        <div className="celebrate" onClick={() => setCelebrate(null)}>
          <div className="card celebrate-card" onClick={(e) => e.stopPropagation()}>
            <div className="celebrate-emoji">🔥</div>
            <h2>It's a match!</h2>
            <p className="muted" style={{ margin: 0 }}>
              You and {m.displayName} both said yes.
            </p>
            <div className="avatar-pair">
              {me.data?.profile.photoUrls[0] && (
                <img src={me.data.profile.photoUrls[0]} alt="You" />
              )}
              <img src={m.photoUrls[0]} alt={m.displayName} />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%" }}
              onClick={() =>
                navigate({
                  to: "/chats/$conversationId",
                  params: { conversationId: celebrate },
                })
              }
            >
              Say hello →
            </button>
          </div>
        </div>
      )}

      <div
        className="link"
        style={{ marginBottom: 14, cursor: "pointer" }}
        onClick={() => navigate({ to: "/matches" })}
      >
        ← Back to matches
      </div>

      <div className="detail-hero">
        <img className="detail-photo" src={m.photoUrls[0]} alt={m.displayName} />
        <div>
          <h1 className="title" style={{ marginBottom: 4 }}>
            {m.displayName}
            {m.age ? `, ${m.age}` : ""}
            <span className="score-pill" style={{ marginLeft: 10, verticalAlign: "middle" }}>
              {Math.round(m.compatibilityScore)}% match
            </span>
          </h1>
          {m.city && <p className="muted" style={{ marginTop: 0 }}>📍 {m.city}</p>}
          <p style={{ lineHeight: 1.6 }}>{m.bio}</p>
          <Chips items={m.interests} shared={myInterests} />

          <div className="rationale">
            <h4>Why Hearth matched you</h4>
            <p style={{ margin: 0, lineHeight: 1.6 }}>{m.rationale}</p>
          </div>

          <div className="bars">
            {BARS.map((b) => (
              <div className="bar-row" key={b.key}>
                <span>{b.label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${Math.round((m.scoreBreakdown[b.key] ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {m.tasteProfileSummary && (
        <>
          <div className="section-title">About {m.displayName}</div>
          <div className="card" style={{ padding: "16px 18px", lineHeight: 1.6 }}>
            {m.tasteProfileSummary}
          </div>
        </>
      )}

      <div className="section-title">Real-world date ideas</div>
      <div className="card">
        {activities.isLoading ? (
          <div className="spinner" style={{ padding: 18 }}>
            Your matchmaker is dreaming up plans…
          </div>
        ) : (
          (activities.data ?? []).map((a) => (
            <div className="activity" key={a.id}>
              <div className="activity-icon">{CATEGORY_ICON[a.category]}</div>
              <div>
                <h5>{a.title}</h5>
                <p>{a.description}</p>
                <p style={{ marginTop: 4 }}>
                  <span className="venue">{a.mockVenueName}</span> · {a.rationale}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {m.mutual && m.conversationId ? (
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 22 }}
          onClick={() =>
            navigate({
              to: "/chats/$conversationId",
              params: { conversationId: m.conversationId! },
            })
          }
        >
          ✦ You matched — open chat
        </button>
      ) : (
        <div className="btn-row" style={{ marginTop: 22 }}>
          <button
            className="btn btn-ghost"
            style={{ flex: 1 }}
            onClick={() => act("pass")}
            disabled={decide.isPending || m.myState !== "pending"}
          >
            Pass
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            onClick={() => act("like")}
            disabled={decide.isPending || m.myState === "passed"}
          >
            {m.myState === "liked" ? "Liked ✓" : "Like"}
          </button>
        </div>
      )}
    </div>
  );
}
