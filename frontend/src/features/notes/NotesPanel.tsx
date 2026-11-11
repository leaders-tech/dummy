/*
This file shows the notes form and notes list for the logged-in user.
Edit this file when note UI, note API calls, or note error handling changes.
Copy this file as a starting point when you add another small logged-in feature panel.
*/

import { useActionState, useEffect, useState } from "react";
import { postJson } from "../../shared/api";
import type { Note } from "../../shared/types";

type NotesPanelProps = {
  refreshKey: number;
  socketStatus: string;
};

export function NotesPanel({ refreshKey, socketStatus }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    postJson<{ notes: Note[] }>("/notes/list")
      .then((data) => {
        if (!cancelled) {
          setNotes(data.notes);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load notes.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // React 19 form action: it returns the error text to show, and `saving` is true while it runs.
  // The textarea stays controlled, so a failed save keeps the draft.
  const [saveError, saveAction, saving] = useActionState(async () => {
    const text = draft.trim();
    if (!text) {
      return "";
    }
    setError("");
    try {
      const data = await postJson<{ note: Note }>("/notes/save", {
        id: editingId,
        text,
      });
      setDraft("");
      setEditingId(null);
      setNotes((current) => {
        const next = current.filter((item) => item.id !== data.note.id);
        return [data.note, ...next];
      });
      return "";
    } catch (submitError) {
      return submitError instanceof Error ? submitError.message : "Could not save the note.";
    }
  }, "");
  const shownError = error || saveError;

  const onDelete = async (id: number) => {
    setError("");
    try {
      await postJson<{ deleted: boolean; id: number }>("/notes/delete", { id });
      setNotes((current) => current.filter((note) => note.id !== id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete the note.");
    }
  };

  const onEdit = (note: Note) => {
    setEditingId(note.id);
    setDraft(note.text);
  };

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-200/70">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Private notes</h3>
          <p className="text-sm text-slate-600">Notes are stored in SQLite and updated live.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">WebSocket: {socketStatus}</span>
      </div>

      <form className="mt-5 space-y-3" action={saveAction}>
        <textarea
          className="min-h-32 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a short note"
          value={draft}
        />
        <div className="flex gap-3">
          <button className="rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-60" disabled={saving} type="submit">
            {editingId ? "Save note" : "Add note"}
          </button>
          {editingId ? (
            <button
              className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700"
              onClick={() => {
                setDraft("");
                setEditingId(null);
              }}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {shownError ? (
        <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {shownError}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-slate-600">Loading notes...</p> : null}
        {!loading && notes.length === 0 ? <p className="text-slate-600">No notes yet.</p> : null}
        {notes.map((note) => (
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={note.id}>
            <p className="whitespace-pre-wrap text-slate-800">{note.text}</p>
            <div className="mt-3 flex gap-3 text-sm">
              <button className="font-medium text-sky-700" onClick={() => onEdit(note)} type="button">
                Edit
              </button>
              <button className="font-medium text-rose-700" onClick={() => void onDelete(note.id)} type="button">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
