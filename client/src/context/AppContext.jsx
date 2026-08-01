import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(sessionStorage.getItem("role") || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:6446";

  axios.defaults.withCredentials = true;

  const checkAuth = async () => {
    const storedRole = sessionStorage.getItem("role");
    
    if (!storedRole) {
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      const endpoint = storedRole.toLowerCase();
      const { data } = await axios.get(`${backendUrl}/api/${endpoint}/is-auth`);

      if (data.success) {
        setIsAuthenticated(true);
        setRole(storedRole.toUpperCase());
        setUser(data.admin || data.teacher || data.student);
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
      sessionStorage.removeItem("role");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (role) {
        await axios.post(`${backendUrl}/api/${role.toLowerCase()}/logout`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      sessionStorage.removeItem("role");
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        checkAuth,
        logout,
        backendUrl,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);