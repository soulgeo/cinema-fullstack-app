import { Link } from "react-router";
import { useAuth } from "../../../context/AuthContext";

const Navigation = () => {
  const { currentUser } = useAuth();

  return (
      <div className="flex flex-row gap-2">
        <Link to="/search" className="btn btn-ghost">Find Movies</Link>
        { currentUser?.is_staff && (
          <Link to="/staff" className="btn btn-ghost">Staff Dashboard</Link>
        )}
      </div>
  );
};

export default Navigation;
