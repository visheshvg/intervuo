import { getSession } from "next-auth/react";
import type {
  Analytics,
  InterviewSession,
  SessionDetail,
  UploadResumeResponse,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function authHeaders(): Promise<HeadersInit> {
  const session = await getSession();
  const token = (session as { accessToken?: string } | null)?.accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(body.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (email: string, name: string, password: string) =>
      request<{ access_token: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      }),
    login: (email: string, password: string) =>
      request<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ id: string; email: string; name: string }>("/api/auth/me"),
  },

  resume: {
    upload: async (
      file: File,
      field: string,
      level: string
    ): Promise<UploadResumeResponse> => {
      const headers = await authHeaders();
      const form = new FormData();
      form.append("file", file);
      form.append("field", field);
      form.append("level", level);
      const res = await fetch(`${BASE_URL}/api/resume/upload`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      return res.json();
    },
  },

  session: {
    list: () => request<InterviewSession[]>("/api/session/"),
    get: (id: string) => request<SessionDetail>(`/api/session/${id}`),
    complete: (id: string) =>
      request<{ total_score: number | null }>(`/api/session/${id}/complete`, {
        method: "POST",
      }),
  },

  interview: {
    submitAudio: async (
      sessionId: string,
      questionIndex: number,
      blob: Blob
    ) => {
      const headers = await authHeaders();
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      const res = await fetch(
        `${BASE_URL}/api/interview/submit-audio/${sessionId}/${questionIndex}`,
        { method: "POST", headers, body: form }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({ detail: "Submission failed" }));
        throw new Error(body.detail ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<{ success: boolean; transcript: string; score: number }>;
    },
  },

  analytics: {
    get: () => request<Analytics>("/api/analytics/"),
  },
};
