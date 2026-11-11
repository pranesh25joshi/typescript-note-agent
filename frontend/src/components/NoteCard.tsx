import { useRef, useState } from "react";
import type { Note } from "../types";
import { noteBody, noteTitle, timeAgo } from "../lib/format";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface NoteCardProps {
  note: Note;
  busy: boolean;
  onToggle: (note: Note) => void;
  onEdit: (note: Note, content: string) => void;
  onDelete: (note: Note) => void;
}

export default function NoteCard({ note, busy, onToggle, onEdit, onDelete }: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const dictationBase = useRef("");
  const body = noteBody(note.content);
  const updated = timeAgo(note.updatedAt);

  const { supported: micSupported, listening: micListening, start: micStart, stop: micStop } =
    useSpeechRecognition(
      (text) => setDraft(dictationBase.current ? `${dictationBase.current} ${text}` : text)
    );

  const startEdit = () => {
    setDraft(note.content);
    setEditing(true);
  };

  const cancelEdit = () => {
    micStop();
    setEditing(false);
    setDraft("");
  };

  const saveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    onEdit(note, trimmed);
    setEditing(false);
    setDraft("");
  };

  const startDictation = () => {
    dictationBase.current = draft.trim();
    micStart();
  };

  return (
    <article className={`note-card ${note.isCompleted ? "is-done" : ""} ${busy ? "is-busy" : ""}`}>
      <div className="note-top">
        <span className={`note-chip ${note.isCompleted ? "chip-done" : "chip-active"}`}>
          {note.isCompleted ? "Completed" : "Active"}
        </span>
        <div className="note-actions">
          <span className="note-time" title={new Date(note.updatedAt).toLocaleString()}>
            {updated}
          </span>
          <button
            type="button"
            className="icon-btn"
            title="Edit note"
            aria-label={`Edit note ${noteTitle(note.content)}`}
            disabled={busy || editing}
            onClick={startEdit}
          >
            <span className="msz" aria-hidden="true">
              edit
            </span>
          </button>
          <button
            type="button"
            className="icon-btn danger"
            title="Ask agent to delete this note"
            aria-label={`Delete note ${noteTitle(note.content)}`}
            disabled={busy || editing}
            onClick={() => onDelete(note)}
          >
            <span className="msz" aria-hidden="true">
              delete
            </span>
          </button>
        </div>
      </div>

      {editing ? (
        <div className="note-edit">
          <textarea
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancelEdit();
            }}
            aria-label="Edit note content"
          />
          <div className="note-edit-actions">
            {micSupported ? (
              <button
                type="button"
                className={`icon-btn note-mic ${micListening ? "listening" : ""}`}
                title={micListening ? "Stop voice typing" : "Voice typing"}
                aria-label={micListening ? "Stop voice typing" : "Start voice typing"}
                aria-pressed={micListening}
                onClick={() => (micListening ? micStop() : startDictation())}
              >
                <span className="msz" aria-hidden="true">
                  mic
                </span>
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!draft.trim() || busy}
              onClick={saveEdit}
            >
              {busy ? (
                <span className="spinner spinner-light" aria-hidden="true" />
              ) : (
                <span className="msz" aria-hidden="true">
                  save
                </span>
              )}
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="note-title">{noteTitle(note.content)}</h2>
          {body ? <p className="note-body">{body}</p> : null}
        </>
      )}

      <div className="note-foot">
        <button
          type="button"
          role="checkbox"
          aria-checked={note.isCompleted}
          className="check-toggle"
          disabled={busy || editing}
          onClick={() => onToggle(note)}
        >
          <span className={`checkbox ${note.isCompleted ? "checked" : ""}`} aria-hidden="true">
            <span className="msz">check</span>
          </span>
          <span className="check-label">
            {note.isCompleted ? "Completed — tap to reopen" : "Mark as completed"}
          </span>
        </button>
        {busy ? <span className="spinner spinner-clay" aria-label="Working" /> : null}
      </div>
    </article>
  );
}
