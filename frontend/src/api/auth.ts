import type { AuthResponse, User, LoginCredentials, SignupData } from "./types";

const API_BASE = "http://localhost:8000/_allauth/browser/v1";

async function getCSRFToken(): Promise<string | null> {
  const name = "csrftoken=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.method && options.method !== "GET") {
    const csrfToken = await getCSRFToken();
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw data as AuthResponse;
  }

  return data as T;
}

export const authApi = {
  getSession: async (): Promise<{ user: User | null }> => {
    // Optimization: Check if we have a hint that a session exists.
    // This prevents 401 errors in the console on every page load for guest users.
    if (localStorage.getItem("auth_hint") !== "true") {
      return { user: null };
    }

    try {
      const res = await request<AuthResponse>("/auth/session");
      return { user: res.data?.user || null };
    } catch (err) {
      // If we got a 401, our hint was wrong (session expired), so clear it.
      const error = err as AuthResponse;
      if (error.status === 401) {
        localStorage.removeItem("auth_hint");
      }
      return { user: null };
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    localStorage.setItem("auth_hint", "true");
    return res;
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    localStorage.setItem("auth_hint", "true");
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await request<void>("/auth/session", {
        method: "DELETE",
      });
    } catch (err) {
      const error = err as AuthResponse;
      if (error.status !== 401) {
        throw err;
      }
    } finally {
      localStorage.removeItem("auth_hint");
    }
  },
};
