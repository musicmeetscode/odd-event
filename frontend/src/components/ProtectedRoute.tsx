import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/api";

interface ProtectedRouteProps {
  requireRole?: UserRole;
}

export const ProtectedRoute = ({ requireRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && role !== requireRole && role !== "admin") {
    return <Navigate to="/events" replace />;
  }

  return <Outlet />;
};
