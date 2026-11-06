import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <span>Roommates</span>
        </div>
        <nav className="nav">
          <button type="button" className="nav-link active">
            Overview
          </button>
          <button type="button" className="nav-link">
            Expenses
          </button>
          <button type="button" className="nav-link">
            Members
          </button>
        </nav>
        <div className="avatar">AK</div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  ),
});
