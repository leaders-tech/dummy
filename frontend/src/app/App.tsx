/*
This file builds the main frontend layout, routes, and route guards.
Edit this file when top-level pages, navigation, or auth guard behavior changes.
Copy the route pattern here when you add another top-level page.
*/

import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./auth";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { AdminPage } from "../pages/AdminPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [error, setError] = useState("");

  const onLogout = async () => {
    setError("");
    try {
      await logout();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Could not log out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Template PWA</h1>
            <p className="text-sm text-slate-600">Simple starter for school projects.</p>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-700">
            <NavLink className="rounded-full px-3 py-2 hover:bg-slate-100" to="/">
              Home
            </NavLink>
            {user ? (
              <>
                <NavLink className="rounded-full px-3 py-2 hover:bg-slate-100" to="/dashboard">
                  Dashboard
                </NavLink>
                {user.is_admin && (
                  <NavLink className="rounded-full px-3 py-2 hover:bg-slate-100" to="/admin">
                    Admin
                  </NavLink>
                )}
                <button className="rounded-full bg-slate-900 px-4 py-2 text-white" onClick={() => void onLogout()}>
                  Logout
                </button>
              </>
            ) : (
              <NavLink className="rounded-full bg-slate-900 px-4 py-2 text-white" to="/login">
                Login
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        {error ? (
          <p role="alert" className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
            {error}
          </p>
        ) : null}
        {children}
      </main>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="text-slate-600">Loading session...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <p className="text-slate-600">Loading session...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  );
}
