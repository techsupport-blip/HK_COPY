import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  useGenerateMatches,
  useMatches,
  useMe,
} from "@hearth/client";

export function MatchesPage() {
  const navigate = useNavigate();
  const me = useMe();
  const matches = useMatches();
  const generate = useGenerateMatches();

  useEffect(() => {
    if (me.data && !me.data.profile.onboardingComplete) {
      navigate({ to: "/onboarding" });
    }
  }, [me.data, navigate]);

  if (matches.isLoading || me.isLoading) {
    return <div className="center-state">Finding your people…</div>;
  }

  const list = matches.data ?? [];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="title" style={{ marginBottom: 2 }}>Today's matches</h1>
          <p className="muted" style={{ margin: 0 }}>
            Hand-picked for you — quality over endless swiping.
          </p>
        </div>
        <button
          className="btn"
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
        >
          {generate.isPending ? "Curating…" : "↻ Refresh"}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="center-state">
          <p>No matches yet.</p>
          <button
            className="btn btn-primary"
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
          >
            {generate.isPending ? "Curating…" : "Find my matches"}
          </button>
        </div>
      ) : (
        <div className="match-grid" style={{ marginTop: 22 }}>
          {list.map((m) => (
            <Link
              key={m.id}
              to="/matches/$matchId"
              params={{ matchId: m.id }}
              className="card match-card"
            >
              <img
                className="match-photo"
                src={m.photoUrls[0]}
                alt={m.displayName}
                loading="lazy"
              />
              <div className="match-body">
                <div className="match-name">
                  <span>
                    {m.displayName}
                    {m.age ? `, ${m.age}` : ""}
                  </span>
                  <span className="score-pill">{Math.round(m.compatibilityScore)}%</span>
                </div>
                <p className="teaser">{m.rationaleTeaser}</p>
                {m.mutual && <span className="mutual-tag">✦ It's a match</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
