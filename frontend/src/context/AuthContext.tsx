import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { AuthResponse, AuthUser } from "../types/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogleToken: (idToken: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "reachinbox.scheduler.token";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiRequest<{ user: AuthUser }>("/api/auth/me", {
          method: "GET",
          token,
        });
        setUser(response.user);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const loginWithGoogleToken = async (idToken: string) => {
    const response = await apiRequest<AuthResponse>("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });

    localStorage.setItem(STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        loginWithGoogleToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
