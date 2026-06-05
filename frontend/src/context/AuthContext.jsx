import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  setAccessToken,
  setOnAuthCleared,
  refreshSession,
  fetchMe,
  logoutUser as apiLogout,
} from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Called when refresh fails (e.g. refresh cookie expired) — drops user state.
  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  // On mount: try to silently restore session using the HttpOnly refresh cookie.
  // If the user has a valid cookie, this gives us a fresh access token + user info.
  useEffect(() => {
    setOnAuthCleared(clearAuth);
    (async () => {
      try {
        const { user: u } = await refreshSession();
        setUser(u);
      } catch {
        // no valid cookie — user must log in
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [clearAuth]);

  // login() — called by Login/Register pages after a successful API call.
  // The api module has already stored the access token in memory.
  const login = (tokenData) => {
    setAccessToken(tokenData.access_token);
    setUser(tokenData.user);
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore network errors on logout — we're clearing state regardless
    }
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
