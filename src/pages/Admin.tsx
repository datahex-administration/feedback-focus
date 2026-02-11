import { useState, useEffect } from "react";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string>("admin");

  useEffect(() => {
    const adminAuth = sessionStorage.getItem("admin_authenticated");
    const savedRole = sessionStorage.getItem("admin_role");
    if (adminAuth === "true") {
      setIsAuthenticated(true);
      setRole(savedRole || "admin");
    }
  }, []);

  const handleLoginSuccess = (loginRole?: string) => {
    const r = loginRole || "admin";
    sessionStorage.setItem("admin_authenticated", "true");
    sessionStorage.setItem("admin_role", r);
    setRole(r);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_authenticated");
    sessionStorage.removeItem("admin_role");
    setIsAuthenticated(false);
    setRole("admin");
  };

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated ? (
        <AdminDashboard onLogout={handleLogout} role={role} />
      ) : (
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default Admin;
