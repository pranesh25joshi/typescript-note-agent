import type { ReactNode } from "react";

interface NavItem {
  id: string;
  icon: string;
  label: string;
  hint?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "notebook", icon: "edit_note", label: "Notebook" },
  { id: "search", icon: "search", label: "Quick Find", hint: "⌘K" },
  { id: "done", icon: "task_alt", label: "Completed" },
  { id: "archive", icon: "inventory_2", label: "Archive" },
];

interface SidebarProps {
  active: string;
  counts: { all: number; active: number; completed: number };
  onSelect: (id: string) => void;
  footer?: ReactNode;
}

export default function Sidebar({ active, counts, onSelect, footer }: SidebarProps) {
  const countFor = (id: string) =>
    id === "notebook" ? counts.all : id === "done" ? counts.completed : undefined;

  return (
    <aside className="sidebar">
      <nav className="side-nav" aria-label="Workspace">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-link ${active === item.id ? "active" : ""}`}
            onClick={() => onSelect(item.id)}
          >
            <span className="msz" aria-hidden="true">
              {item.icon}
            </span>
            <span className="side-link-label">{item.label}</span>
            {countFor(item.id) !== undefined ? (
              <span className="side-count">{countFor(item.id)}</span>
            ) : item.hint ? (
              <kbd className="side-kbd">{item.hint}</kbd>
            ) : null}
          </button>
        ))}
      </nav>
      <div className="side-foot">
        {footer}
        <button type="button" className="side-link muted" onClick={() => onSelect("preferences")}>
          <span className="msz" aria-hidden="true">
            settings
          </span>
          <span className="side-link-label">Preferences</span>
        </button>
      </div>
    </aside>
  );
}
