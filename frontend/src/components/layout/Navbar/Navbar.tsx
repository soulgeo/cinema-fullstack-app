import { Link } from "react-router";
import UserDropdown from "./UserDropdown";
import Navigation from "./Navigation";
import Logo from "../../ui/Logo";
import { useAuth } from "../../../context/AuthContext";
import { Menu, UserRound, Film, Calendar, Search, LogOut } from "lucide-react";

const Navbar = () => {
  const { currentUser, userLoggedIn, logout, setShowLogin, setShowSignup } = useAuth();

  return (
    <div className="flex flex-row items-center justify-between fixed top-0 w-full shadow-md min-h-15 bg-base-100 px-4 z-50">
      <div
        id="left-navbar-items"
        className="flex flex-row items-center justify-start gap-4"
      >
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </Link>
        <Navigation />
      </div>
      <div id="right-navbar-items" className="flex flex-row items-center justify-end gap-2 mr-2">
        <UserDropdown />

        {/* Mobile Menu Dropdown */}
        <div className="dropdown dropdown-end md:hidden">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
            <Menu size={24} />
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu menu-sm bg-base-200 rounded-box w-56 p-2 shadow-xl border border-base-content/5 mt-3 z-50"
          >
            <li>
              <Link to="/search" className="flex items-center gap-2">
                <Search size={16} />
                Find Movies
              </Link>
            </li>
            
            {currentUser?.is_staff && (
              <li>
                <Link to="/staff" className="flex items-center gap-2">
                  <Film size={16} />
                  Staff Dashboard
                </Link>
              </li>
            )}

            {currentUser?.is_admin && (
              <li className="flex flex-col items-start gap-1 p-0">
                <span className="text-[10px] font-black uppercase text-base-content/40 px-3 pt-2">Admin Options</span>
                <Link to="/admin" className="w-full flex items-center gap-2 pl-6">
                  Dashboard
                </Link>
                <Link to="/admin/movies" className="w-full flex items-center gap-2 pl-6">
                  Manage Movies
                </Link>
                <Link to="/admin/screenings" className="w-full flex items-center gap-2 pl-6">
                  Manage Screenings
                </Link>
                <Link to="/admin/halls" className="w-full flex items-center gap-2 pl-6">
                  Manage Halls
                </Link>
              </li>
            )}

            <div className="divider my-1"></div>

            {userLoggedIn ? (
              <>
                <div className="text-[10px] font-black uppercase text-base-content/40 px-3 py-1">
                  Hi, {currentUser?.first_name}
                </div>
                <li>
                  <Link to="/account" className="flex items-center gap-2">
                    <UserRound size={16} />
                    Account Settings
                  </Link>
                </li>
                <li>
                  <Link to="/tickets" className="flex items-center gap-2">
                    <Calendar size={16} />
                    My Tickets
                  </Link>
                </li>
                <li>
                  <Link to="/purchases" className="flex items-center gap-2">
                    <Film size={16} />
                    My Purchases
                  </Link>
                </li>
                <li>
                  <button 
                    onClick={() => logout()} 
                    className="flex items-center gap-2 text-error hover:bg-error/10"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <button onClick={() => setShowLogin(true)} className="flex items-center gap-2">
                    Login
                  </button>
                </li>
                <li>
                  <button onClick={() => setShowSignup(true)} className="flex items-center gap-2">
                    Become a Member
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
