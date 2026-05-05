import { Link } from "react-router";
import { useAuth } from "../../../context/AuthContext";

const Navigation = () => {
  const { userLoggedIn } = useAuth();

  return (
    <>
      {userLoggedIn && (
        <div className="flex flex-row gap-2">
          <Link to="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
          <Link to="/continue" className="btn btn-ghost">
            Continue Learning
          </Link>
        </div>
      )}
    </>
  );
};

export default Navigation;
