import { useEffect, useState } from "react";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  membership_status: "active" | "inactive";
  access_token: string;
}

export function useAuthUser() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const saveUser = (userData: StoredUser) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const clearUser = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return {
    user,
    loading,
    saveUser,
    clearUser,
    isAuthenticated: !!user,
  };
}
