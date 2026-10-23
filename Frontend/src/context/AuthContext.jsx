import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));

  function login(newToken, newUserId = null) {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    if (newUserId) {
      localStorage.setItem("userId", newUserId);
      setUserId(newUserId);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    setToken(null);
    setUserId(null);
  }

  useEffect(() => {
    window.addEventListener("auth:logout", logout);

    return () => {
      window.removeEventListener("auth:logout", logout);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
