import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Admin, Session } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface AdminContextType {
  isAdmin: boolean;
  admin: Admin | null;
  login: (admin: Admin) => void;
  logout: () => void;
  activeSession: Session | null;
  isLoadingSession: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage if available
  const [admin, setAdmin] = useState<Admin | null>(() => {
    try {
      const stored = localStorage.getItem("admin_auth");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const { data: activeSession, isLoading: isLoadingSession } = useQuery({
    queryKey: ["active-session"],
    queryFn: async () => {
      const res = await fetch("/api/sessions/active");
      if (!res.ok) return null;
      return res.json() as Promise<Session | null>;
    }
  });

  const login = (data: Admin) => {
    setAdmin(data);
    localStorage.setItem("admin_auth", JSON.stringify(data));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("admin_auth");
  };

  return (
    <AdminContext.Provider value={{ 
      isAdmin: !!admin, 
      admin, 
      login, 
      logout,
      activeSession: activeSession || null,
      isLoadingSession
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
