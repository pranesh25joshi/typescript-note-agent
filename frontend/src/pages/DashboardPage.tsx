import { useCallback, useEffect, useMemo, useState } from "react";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import CommandBar from "../components/CommandBar";
import NoteCard from "../components/NoteCard";
import { useAuth } from "../auth/AuthContext";
import { useToasts } from "../components/Toasts";
import { agentApi, notesApi } from "../api";
import type { Note, RunSummary } from "../types";
import { noteTitle } from "../lib/format";

type View = "notebook" | "search" | "done" | "archive";

const SKELETONS = [0, 1, 2, 3, 4, 5];

export default function DashboardPage() {
  const { logout } = useAuth();
  const { push } = useToasts();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [view, setView] = useState<View>("notebook");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [busyNoteIds, setBusyNoteIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);

  const focusCommand = useCallback(() => {
    window.dispatchEvent(new CustomEvent("tf:focus-command"));
  }, []);

  const refreshNotes = useCallback(async () => {
    try {
      const res = await notesApi.list();
      setNotes(res.data);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load notes");
    }
  }, []);

  useEffect(() => {
    refreshNotes().finally(() => setLoading(false));
  }, [refreshNotes]);

  const summarize = useCallback(
    (raw: Awaited<ReturnType<typeof agentApi.chat>>): RunSummary[] => {
      if (!raw.isToolCall || !raw.results || raw.results.length === 0) {
        push({
          kind: "info",
          title: "Agent had nothing to change",
          body: "Try a more direct instruction, e.g. “Add a note: drink water at 3pm”.",
        });
        return [];
      }
      return raw.results.map((r) => {
        if (r.status !== "success") {
          return { verb: "Failed", title: r.error ?? "operation error", ok: false };
        }
        const content = r.data?.content ?? "";
        const title = content ? noteTitle(content) : "note";
        switch (r.action) {
          case "create_note":
            return { verb: "Created", title, ok: true };
          case "update_note":
            return { verb: "Updated", title, ok: true };
          case "delete_note":
            return { verb: "Deleted", title, ok: true };
          case "search_notes":
            return { verb: "Searched", title: `${(r.data as unknown as string[])?.length ?? 0} matches`, ok: true };
          default:
            return { verb: r.action, title, ok: true };
        }
      });
    },
    [push]
  );

  const runAgent = useCallback(
    async (prompt: string): Promise<RunSummary[]> => {
      setRunning(true);
      try {
        const raw = await agentApi.chat(prompt);
        const summary = summarize(raw);
        const okCount = summary.filter((s) => s.ok).length;
        const failed = summary.filter((s) => !s.ok);
        if (okCount > 0) {
          push({
            kind: "success",
            title: `Agent completed ${okCount} op${okCount === 1 ? "" : "s"}`,
          });
        }
        for (const f of failed) {
          push({ kind: "error", title: `${f.verb}: ${f.title}` });
        }
        await refreshNotes();
        return summary;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Agent request failed";
        push({ kind: "error", title: "Agent run failed", body: message });
        return [{ verb: "Failed", title: message, ok: false }];
      } finally {
        setRunning(false);
      }
    },
    [push, refreshNotes, summarize]
  );

  const toggleNote = useCallback(
    async (note: Note) => {
      setBusyNoteIds((prev) => new Set(prev).add(note.id));
      try {
        const res = await notesApi.update(note.id, { isCompleted: !note.isCompleted });
        setNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)));
        await refreshNotes();
        push({
          kind: "success",
          title: note.isCompleted ? "Note reopened" : "Note completed",
        });
      } catch (err) {
        push({
          kind: "error",
          title: "Could not update note",
          body: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setBusyNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(note.id);
          return next;
        });
      }
    },
    [push, refreshNotes]
  );

  const editNote = useCallback(
    async (note: Note, content: string) => {
      setBusyNoteIds((prev) => new Set(prev).add(note.id));
      try {
        const res = await notesApi.update(note.id, { content });
        setNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)));
        await refreshNotes();
        push({ kind: "success", title: "Note updated" });
      } catch (err) {
        push({
          kind: "error",
          title: "Could not update note",
          body: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setBusyNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(note.id);
          return next;
        });
      }
    },
    [push, refreshNotes]
  );

  const confirmDelete = useCallback(async () => {
    const note = pendingDelete;
    if (!note) return;
    setPendingDelete(null);
    setBusyNoteIds((prev) => new Set(prev).add(note.id));
    try {
      await agentApi.chat(`Delete the note with id "${note.id}".`);
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
      await refreshNotes();
      push({ kind: "success", title: "Note deleted", body: noteTitle(note.content) });
    } catch (err) {
      push({
        kind: "error",
        title: "Could not delete note",
        body: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusyNoteIds((prev) => {
        const next = new Set(prev);
        next.delete(note.id);
        return next;
      });
    }
  }, [pendingDelete, push, refreshNotes]);

  const counts = useMemo(
    () => ({
      all: notes.length,
      active: notes.filter((n) => !n.isCompleted).length,
      completed: notes.filter((n) => n.isCompleted).length,
    }),
    [notes]
  );

  const visibleNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = notes;
    if (view === "done" || view === "archive") list = list.filter((n) => n.isCompleted);
    if (q) list = list.filter((n) => n.content.toLowerCase().includes(q));
    if (view === "archive") list = [...list].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    return list;
  }, [notes, view, query]);

  const handleSidebar = useCallback(
    (id: string) => {
      if (id === "preferences") {
        push({ kind: "info", title: "Preferences", body: "Settings arrive in a future release." });
        return;
      }
      setView(id as View);
      if (id !== "search") setQuery("");
    },
    [push]
  );

  const empty = !loading && !loadError && visibleNotes.length === 0;

  return (
    <div className="shell">
      <div className="ambient" aria-hidden="true">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
      </div>

      <TopBar />
      <Sidebar active={view} counts={counts} onSelect={handleSidebar} />

      <div className="shell-main">
        <main className="content">
          <CommandBar onRun={runAgent} running={running} />

          <section className="filter-row" aria-label="Filters and actions">
            <nav className="filter-tabs">
              <button
                type="button"
                className={`filter-chip ${view === "notebook" || view === "search" ? "active" : ""}`}
                onClick={() => {
                  setView("notebook");
                  setQuery("");
                }}
              >
                All Notes <span className="chip-count">{counts.all}</span>
              </button>
              <button
                type="button"
                className={`filter-chip ${view === "done" ? "active" : ""}`}
                onClick={() => setView("done")}
              >
                Active <span className="chip-count quiet">{counts.active}</span>
              </button>
              <button
                type="button"
                className={`filter-chip ${view === "archive" ? "active" : ""}`}
                onClick={() => setView("archive")}
              >
                Completed <span className="chip-count quiet">{counts.completed}</span>
              </button>
              <button
                type="button"
                className={`filter-chip search-toggle ${view === "search" ? "active" : ""}`}
                onClick={() => setView(view === "search" ? "notebook" : "search")}
              >
                <span className="msz" aria-hidden="true">
                  search
                </span>
                Find
              </button>
            </nav>

            <button type="button" className="btn btn-primary btn-sm" onClick={focusCommand}>
              <span className="msz" aria-hidden="true">
                add
              </span>
              New Note
            </button>
          </section>

          {view === "search" ? (
            <div className="search-row">
              <span className="msz" aria-hidden="true">
                search
              </span>
              <input
                type="text"
                value={query}
                autoFocus
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter your notes by keyword…"
                aria-label="Search notes"
              />
              {query ? (
                <button type="button" className="icon-btn" onClick={() => setQuery("")} aria-label="Clear search">
                  <span className="msz" aria-hidden="true">
                    close
                  </span>
                </button>
              ) : null}
            </div>
          ) : null}

          {loading ? (
            <div className="notes-grid">
              {SKELETONS.map((i) => (
                <div key={i} className="note-card skeleton" aria-hidden="true">
                  <div className="sk-line w-1/3" />
                  <div className="sk-line w-3/4 tall" />
                  <div className="sk-line w-full" />
                  <div className="sk-line w-2/3" />
                </div>
              ))}
            </div>
          ) : null}

          {loadError && !loading ? (
            <div className="empty-state error">
              <span className="msz" aria-hidden="true">
                cloud_off
              </span>
              <h2>Can’t reach your notes</h2>
              <p>{loadError}</p>
              <button type="button" className="btn btn-primary" onClick={() => void refreshNotes()}>
                Try again
              </button>
            </div>
          ) : null}

          {empty && !loadError ? (
            <div className="empty-state">
              <span className="msz" aria-hidden="true">
                {query ? "search_off" : "edit_note"}
              </span>
              <h2>{query ? "Nothing matches" : "Your notebook is empty"}</h2>
              <p>
                {query
                  ? `No notes contain “${query}”.`
                  : "Type an instruction above — “Plan my day with 3 tasks” — and watch the agent fill this grid."}
              </p>
            </div>
          ) : null}

          {!loading && visibleNotes.length > 0 ? (
            <div className="notes-grid">
              {visibleNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  busy={busyNoteIds.has(note.id) || running}
                  onToggle={(n) => void toggleNote(n)}
                  onEdit={(n, c) => void editNote(n, c)}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          ) : null}
        </main>

        <footer className="status-footer">
          <div className="status-footer-left">
            <span className="msz" aria-hidden="true">
              hub
            </span>
            <div>
              <p className="status-footer-title">
                Agent ready <span className="chip-autopilot">Autopilot</span>
              </p>
              <p className="status-footer-sub">
                {counts.active} active · {counts.completed} completed · your agent manages notes with tool calls
              </p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            Sign out
          </button>
        </footer>
      </div>

      {pendingDelete ? (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete">
          <div className="modal">
            <span className="msz modal-icon" aria-hidden="true">
              delete
            </span>
            <h3>Delete this note?</h3>
            <p>
              “{noteTitle(pendingDelete.content)}” will be removed by the agent. This can’t be undone.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={() => void confirmDelete()}>
                Delete note
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
