import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router";

export default function ProtectedRoute({ allowedRoles }) {
  const { token, user, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Token is present but /api/auth/me hasn't resolved yet (e.g. right after a refresh).
  if (!isAuthenticated) {
    return <p className="p-8 text-center">Loading...</p>;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
