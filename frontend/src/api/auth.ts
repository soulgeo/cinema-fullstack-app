import { request } from "./client";
import type { AuthResponse, User, LoginCredentials, SignupData } from "./types";

const AUTH_BASE = "http://localhost:8000/_allauth/browser/v1";

const authRequest = <T>(path: string, options: RequestInit = {}) => 
  request<T>(AUTH_BASE, path, options);

export const authApi = {
  getSession: async (): Promise<{ user: User | null }> => {
    if (localStorage.getItem("auth_hint") !== "true") {
      return { user: null };
    }

    try {
      const res = await authRequest<AuthResponse>("/auth/session");
      return { user: res.data?.user || null };
    } catch (err) {
      const error = err as AuthResponse;
      if (error.status === 401) {
        localStorage.removeItem("auth_hint");
      }
      return { user: null };
    }
  },

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const res = await authRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    localStorage.setItem("auth_hint", "true");
    return res;
  },

  signup: async (data: SignupData): Promise<AuthResponse> => {
    const res = await authRequest<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    });
    localStorage.setItem("auth_hint", "true");
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await authRequest<void>("/auth/session", {
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

  updateUser: async (data: Partial<User>): Promise<AuthResponse> => {
    return authRequest<AuthResponse>("/auth/user", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data: any): Promise<AuthResponse> => {
    return authRequest<AuthResponse>("/account/password/change", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};
