import { Navigate } from "react-router-dom";

type UserRole = "Admin" | "Employee";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles: UserRole[];
};

export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") as UserRole | null;

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    if (role === "Admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    if (role === "Employee") {
      return <Navigate to="/employee/home" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
