import type { DocTemplate, ExpenseMonth, Organisme, Profile, SavedDocument, User } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.error || res.statusText || "Erreur réseau", res.status);
  }
  return body as T;
}

export interface BootstrapData {
  user: User;
  profiles: Profile[];
  users: User[];
  organismes: Organisme[];
  documents: SavedDocument[];
  templates: DocTemplate[];
  expenseMonths: ExpenseMonth[];
}

export const api = {
  health: () => request<{ ok: boolean }>("/api/health"),

  login: (login: string, password: string) =>
    request<{ user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    }),

  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  me: () => request<{ user: User }>("/api/auth/me"),

  bootstrap: () => request<BootstrapData>("/api/bootstrap"),

  saveOrganismes: (organismes: Organisme[]) =>
    request<{ organismes: Organisme[] }>("/api/organismes", {
      method: "PUT",
      body: JSON.stringify({ organismes }),
    }),

  saveProfiles: (profiles: Profile[]) =>
    request<{ profiles: Profile[] }>("/api/profiles", {
      method: "PUT",
      body: JSON.stringify({ profiles }),
    }),

  saveUsers: (users: User[]) =>
    request<{ users: User[] }>("/api/users", {
      method: "PUT",
      body: JSON.stringify({ users }),
    }),

  saveDocuments: (documents: SavedDocument[]) =>
    request<{ documents: SavedDocument[] }>("/api/documents", {
      method: "PUT",
      body: JSON.stringify({ documents }),
    }),

  saveTemplates: (templates: DocTemplate[]) =>
    request<{ templates: DocTemplate[] }>("/api/templates", {
      method: "PUT",
      body: JSON.stringify({ templates }),
    }),

  saveExpenseMonths: (months: ExpenseMonth[]) =>
    request<{ expenseMonths: ExpenseMonth[] }>("/api/expenses", {
      method: "PUT",
      body: JSON.stringify({ months }),
    }),
};
