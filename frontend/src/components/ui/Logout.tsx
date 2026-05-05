import Card from "../ui/Card";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { getAuthErrorMessage } from "../../api/authErrors";
import { useAuth } from "../../context/AuthContext";

interface LogoutProps {
  closeModal?: () => void;
}

const Logout = ({ closeModal }: LogoutProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const onSubmit = async (e: MouseEvent) => {
    e.stopPropagation();

    const logoutPromise = logout();

    toast.promise(logoutPromise, {
      loading: "Signing out...",
      success: "Successfully signed out!",
      error: (err) => getAuthErrorMessage(err),
    });

    try {
      await logoutPromise;
      if (closeModal) {
        closeModal();
      }
      navigate("/");
    } catch (err) {
      // Error handled by toast
    }
  };

  return (
    <Card>
      <div className="w-full p-2 text-center font-bold">Are you sure?</div>
      <button className="btn btn-error mt-2 w-full" onClick={onSubmit}>
        Sign Out
      </button>
    </Card>
  );
};
export default Logout;
