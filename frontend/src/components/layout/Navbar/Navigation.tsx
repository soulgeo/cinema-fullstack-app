import { Link } from "react-router";
import { useAuth } from "../../../context/AuthContext";
import { ChevronDown } from "lucide-react";

const Navigation = () => {
  const { currentUser } = useAuth();

  return (
      <div className="hidden md:flex flex-row gap-2">
        { currentUser?.is_admin && (
          <div className="dropdown dropdown-hover">
            <div tabIndex={0} role="button" className="btn btn-ghost flex items-center gap-1">
              Admin
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
              <li>
                <Link to="/admin/halls">Manage Halls</Link>
              </li>
            </ul>
          </div>
        )}
        { currentUser?.is_staff && (
          <div className="dropdown dropdown-hover">
            <div tabIndex={0} role="button" className="btn btn-ghost flex items-center gap-1">
              Staff
              <ChevronDown size={14} />
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu menu-md bg-base-200 rounded-box w-52 p-2 shadow z-50 border border-base-content/5"
            >
              <li>
                <Link to="/staff">Dashboard</Link>
              </li>
              <li>
                <Link to="/staff/scan">Scan Tickets</Link>
              </li>
              <li>
                <Link to="/staff/purchases">Search Purchases</Link>
              </li>
            </ul>
          </div>
        )}
        <Link to="/search" className="btn btn-ghost">Find Movies</Link>
      </div>
  );
};

export default Navigation;
