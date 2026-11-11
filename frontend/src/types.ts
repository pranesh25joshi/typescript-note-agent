export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Note {
  id: string;
  content: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AgentActionName =
  | "create_note"
  | "update_note"
  | "delete_note"
  | "search_notes"
  | string;

export interface AgentActionResult {
  action: AgentActionName;
  status: "success" | "failed" | string;
  data?: Note;
  error?: string;
}

export interface AgentChatResponse {
  success: boolean;
  isToolCall?: boolean;
  results?: AgentActionResult[];
  message?: string;
}

export interface RunSummary {
  verb: string;
  title: string;
  ok: boolean;
}

export type NoteFilter = "all" | "active" | "completed";
