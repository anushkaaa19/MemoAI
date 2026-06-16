import React, { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";
import { setAccessToken, clearAccessToken } from "../utils/axiosInstance";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On app load — try to restore session via refresh token cookie
  // If cookie is valid, server returns a new access token silently
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Cookie is sent automatically — if it's valid we get a new access token
      const { data } = await authService.refresh();
      setAccessToken(data.accessToken);

      // Now fetch the actual user profile
      const profile = await authService.getProfile();
      setUser(profile.data);
      setIsAuthenticated(true);
    } catch (error) {
      // Refresh token missing or expired — user must log in
      clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    // accessToken already set inside authService.login()
    // No localStorage, no token passed here at all
    setUser(userData);
    setIsAuthenticated(true);
    setLoading(false);
  };

  const logout = async () => {
    try {
      await authService.logout(); // clears httpOnly cookie on server
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAccessToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (updatedUserData) => {
    // No localStorage — just update React state
    setUser((prev) => ({ ...prev, ...updatedUserData }));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuthStatus,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};