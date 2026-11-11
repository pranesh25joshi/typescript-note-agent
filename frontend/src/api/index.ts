import type { AgentChatResponse, Note, User } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldError[];

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
}

interface NotesResponse {
  success: boolean;
  data: Note[];
}

interface UpdateNoteResponse {
  success: boolean;
  message: string;
  data: Note;
}

export const authApi = {
  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`, body?.errors ?? []);
    }
    return body as AuthResponse;
  },

  async register(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`, body?.errors ?? []);
    }
    return body as AuthResponse;
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
    }
    return body as { success: boolean; message: string };
  },
};

export const userApi = {
  async me(): Promise<{ message: string; user: User }> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/user/me`, {
        credentials: "include",
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
    }
    return body as { message: string; user: User };
  },
};

export const notesApi = {
  async list(): Promise<NotesResponse> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/notes`, {
        credentials: "include",
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
    }
    return body as NotesResponse;
  },

  async update(
    id: string,
    payload: { content?: string; isCompleted?: boolean }
  ): Promise<UpdateNoteResponse> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`, body?.errors ?? []);
    }
    return body as UpdateNoteResponse;
  },
};

export const agentApi = {
  async chat(prompt: string): Promise<AgentChatResponse> {
    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
    } catch {
      throw new ApiError(
        0,
        "Cannot reach the server. Make sure the backend is running on port 4000."
      );
    }
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(res.status, body?.message ?? `Request failed (${res.status})`);
    }
    return body as AgentChatResponse;
  },
};
