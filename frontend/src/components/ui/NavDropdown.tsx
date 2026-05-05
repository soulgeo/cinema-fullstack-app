import type { ReactNode } from "react";
import { Link } from "react-router";
import { ChevronDown } from "lucide-react";

interface NavDropdownItem {
  to: string;
  label: string;
  isActive: boolean;
}

interface NavDropdownProps {
  buttonLabel: ReactNode;
  items: NavDropdownItem[];
  dropdownClassName?: string;
}

const NavDropdown = ({ buttonLabel, items, dropdownClassName = "" }: NavDropdownProps) => {
  const handleItemClick = () => {
    const elem = document.activeElement;
    if (elem instanceof HTMLElement) {
      elem.blur();
    }
  };

  return (
    <div className={`dropdown dropdown-end ${dropdownClassName}`}>
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost btn-sm md:btn-md normal-case flex justify-between w-28 md:w-64 text-left"
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown size={16} className="ml-2 shrink-0" />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-100 rounded-box z-50 w-72 p-2 shadow mt-2 max-h-96 overflow-y-auto"
      >
        {items.map((item, index) => (
          <li key={index}>
            <Link
              to={item.to}
              className={item.isActive ? "active" : ""}
              onClick={handleItemClick}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavDropdown;
