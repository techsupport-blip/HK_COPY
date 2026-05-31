import { useEffect } from "react";
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useAuth } from "@hearth/client";

const PUBLIC_PATHS = new Set(["/login"]);

export function RootLayout() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.has(pathname);
    if (!isAuthenticated && !isPublic) {
      navigate({ to: "/login" });
    } else if (isAuthenticated && pathname === "/login") {
      navigate({ to: "/matches" });
    }
  }, [isAuthenticated, pathname, navigate]);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to={isAuthenticated ? "/matches" : "/login"} className="brand">
          <span className="flame">🔥</span> Hearth
        </Link>
        {isAuthenticated && (
          <nav className="nav">
            <Link to="/matches" activeProps={{ className: "active" }}>
              Matches
            </Link>
            <Link to="/chats" activeProps={{ className: "active" }}>
              Chats
            </Link>
            <button
              className="nav"
              style={{ background: "none", border: "none", color: "var(--text-dim)", fontWeight: 600 }}
              onClick={() => logout()}
            >
              Sign out
            </button>
          </nav>
        )}
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
