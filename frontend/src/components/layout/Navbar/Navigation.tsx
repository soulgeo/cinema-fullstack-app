import { useAuth } from "../../../context/AuthContext";

const Navigation = () => {
  const { userLoggedIn } = useAuth();

  return (
    <>
      {userLoggedIn && (
        <div className="flex flex-row gap-2">
        </div>
      )}
    </>
  );
};

export default Navigation;
