import React, { createContext, useContext, useState } from 'react';
import { constants } from '../utils/const';

interface LoginResult {
  success: boolean;
  redirectTo?: string;
  error?: string;
  twoFaRequired?: boolean;
  pendingToken?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (pendingToken: string, code: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(constants.TOKEN_KEY) !== "";
  });

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const response = await fetch(`${constants.API_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: username, password }),
    });
    const data = await response.json();

    if (response.ok && data.two_fa_required) {
      return {
        success: false,
        twoFaRequired: true,
        pendingToken: data.pending_token,
      };
    }

    if (response.ok && data.token) {
      setIsAuthenticated(true);
      localStorage.setItem(constants.TOKEN_KEY, data.token);
      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: data.error || "Invalid username or password"
    };
  };

  const verifyTwoFactor = async (pendingToken: string, code: string): Promise<LoginResult> => {
    const response = await fetch(`${constants.API_URL}/admin/2fa/login-verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pending_token: pendingToken, code }),
    });
    const data = await response.json();

    if (response.ok && data.token) {
      setIsAuthenticated(true);
      localStorage.setItem(constants.TOKEN_KEY, data.token);
      return {
        success: true,
        redirectTo: "/",
      };
    }

    return {
      success: false,
      error: data.error || "Invalid or expired code"
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(constants.TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, verifyTwoFactor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}