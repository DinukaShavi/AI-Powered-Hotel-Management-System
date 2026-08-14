import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { logout } from "@/lib/features/authSlice";

function Navigation() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "ADMIN";
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav className="z-10 bg-black flex  items-center justify-between px-8 text-white py-4">
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-2xl font-bold ">
          Horizone
        </Link>
        <div className="hidden md:flex space-x-6">
          <Link to={`/`} className="transition-colors">
            Home
          </Link>
          {isAuthenticated && (
            <Link to={`/my-bookings`} className="transition-colors">
              My Bookings
            </Link>
          )}
          {isAdmin && (
            <Link to={`/hotels/create`} className="transition-colors">
              Create Hotel
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" className="">
          <Globe className="h-5 w-5 mr-2" />
          EN
        </Button>
        {isAuthenticated ? (
          <>
            <span className="text-sm">
              {user?.name}
              {user?.role === "ADMIN" && (
                <span className="ml-2 text-xs uppercase text-sky-400">
                  Admin
                </span>
              )}
            </span>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <Link to="/sign-in">Log In</Link>
            </Button>
            <Button asChild>
              <Link to="/sign-up">Sign Up</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navigation;
