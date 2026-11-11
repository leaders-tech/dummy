/*
This file shows the page for addresses that do not exist in the app.
Edit this file when the "page not found" text or its links change.
Do not copy this file. Keep one catch-all page for unknown addresses.
*/

import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-md rounded-3xl border border-slate-200/80 bg-white/85 p-8 text-center shadow-lg shadow-slate-200/70">
      <h2 className="text-2xl font-semibold text-slate-900">Page not found</h2>
      <p className="mt-2 text-slate-600">This address does not exist in the app.</p>
      <Link className="mt-6 inline-flex rounded-full bg-slate-900 px-5 py-3 font-semibold text-white" to="/">
        Go to home page
      </Link>
    </section>
  );
}
