import type { AuthProvider } from "@refinedev/core";
import { API_URL, TOKEN_KEY } from "./constants";

export const authProvider: AuthProvider = {
  login: async ({ username , password }) => {
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user: username , password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
        return {
          success: true,
          redirectTo: "/",
        };
      }

      return {
        success: false,
        error: {
          name: "Login Error",
          message: data.error || "Invalid username or password",
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "Network Error",
          message: "Failed to connect to the server",
        },
      };
    }
  },
  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        return {
          authenticated: true,
        };
      }

    } catch (error) {
      console.error("Failed to fetch system status:", error);
    }
    return {
      authenticated: false,
      redirectTo: "/login",
    };
  },
  getPermissions: async () => null,
  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      return {
        id: 1,
        name: "Admin",
        avatar: "https://i.pravatar.cc/300",
      };
    }
    return null;
  },
  onError: async (error) => {
    console.error(error);
    return { error };
  },
};