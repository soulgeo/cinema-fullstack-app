import { Link } from "react-router";
import UserDropdown from "./UserDropdown";
import Navigation from "./Navigation";
import Logo from "../../ui/Logo";

const Navbar = () => {
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
      <div id="right-navbar-items" className="flex flex-row justify-end mr-2">
        <UserDropdown />
      </div>
    </div>
  );
};

export default Navbar;
