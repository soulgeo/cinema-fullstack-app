import { Link } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { ChevronDown } from "lucide-react";

const Navigation = () => {
  const { currentUser } = useAuth();

  return (
      <div className="flex flex-row gap-2">
        <Link to="/search" className="btn btn-ghost">Find Movies</Link>
        { currentUser?.is_staff && (
          <Link to="/staff" className="btn btn-ghost">Staff Dashboard</Link>
        )}
        { currentUser?.is_admin && (
          <div className="dropdown dropdown-hover">
            <div tabIndex={0} role="button" className="btn btn-ghost flex items-center gap-1">
              Admin Panel
              <ChevronDown size={14} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu menu-md bg-base-200 rounded-box w-52 p-2 shadow z-50 border border-base-content/5"
            >
              <li>
                <Link to="/admin">Dashboard</Link>
              </li>
              <li>
                <Link to="/admin/movies">Manage Movies</Link>
              </li>
              <li>
                <Link to="/admin/screenings">Manage Screenings</Link>
              </li>
            </ul>
          </div>
        )}
      </div>
  );
};

export default Navigation;
