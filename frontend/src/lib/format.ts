/** First meaningful line of a note's content, cleaned of light markdown decoration. */
export function noteTitle(content: string): string {
  const line =
    content
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? "Untitled note";
  return line.replace(/^#{1,6}\s*/, /^\*\*.*\*\*$/.test(line) ? "" : "").trim() || "Untitled note";
}

/** Everything after the first line. */
export function noteBody(content: string): string {
  const lines = content.split("\n").map((l) => l.trim());
  const firstIdx = lines.findIndex((l) => l.length > 0);
  return lines
    .slice(firstIdx + 1)
    .join("\n")
    .trim();
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "just now";
  const s = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (s < 45) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
