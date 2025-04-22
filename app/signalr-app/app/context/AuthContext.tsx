// app/context/AuthContext.tsx
'use client';

import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";

interface AuthContextType {
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  ensureLoggedIn: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  login: async () => {},
  logout: () => {},
  ensureLoggedIn: () => {},
  getToken: () => null,
});

// Safe storage operations that work in both client and server environments
const storage = {
  getItem: () => {
    try {
      return typeof window !== 'undefined' ? sessionStorage.getItem("accessToken") : null;
    } catch {
      return null;
    }
  },
  setItem: (token: string) => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem("accessToken", token);
      }
    } catch {
      // Ignore errors in server environment
    }
  },
  removeItem: () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem("accessToken");
      }
    } catch {
      // Ignore errors in server environment
    }
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = storage.getItem();
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const getToken = useCallback(() => {
    return storage.getItem();
  }, []);

  const ensureLoggedIn = useCallback(() => {
    const token = storage.getItem();
    if (!token) {
      navigate('/signin');
    }
  }, [navigate]);

  const login = useCallback(async (username: string, password: string) => {
    if (!username.trim() || !password.trim()) {
      throw new Error("Please enter username and password.");
    }

    try {
      const response = await fetch(
        'http://localhost:8080/realms/myrealm/protocol/openid-connect/token',
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            grant_type: "password",
            client_id: "myclient",
            username,
            password,
          }).toString(),
        }
      );

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      storage.setItem(data.access_token);
      setIsLoggedIn(true);
      navigate('/');
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  }, [navigate]);

  const logout = useCallback(() => {
    storage.removeItem();
    setIsLoggedIn(false);
    navigate('/signin');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout, ensureLoggedIn, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const useRequireAuth = () => {
  const { ensureLoggedIn } = useAuth();
  
  useEffect(() => {
    ensureLoggedIn();
  }, [ensureLoggedIn]);
};