import Card from "../ui/Card";
import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { getAuthErrorMessage } from "../../api/authErrors";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface LoginProps {
  closeModal?: () => void;
  onShowSignup?: () => void;
}

const Login = ({ closeModal, onShowSignup }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    const loginPromise = login({ email, password });

    toast.promise(loginPromise, {
      loading: "Logging in...",
      success: "Successfully logged in!",
      error: (err) => getAuthErrorMessage(err),
    });

    try {
      await loginPromise;
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
      <div className="w-full p-2 text-center font-bold">Log In</div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          className="input input-ghost w-full"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        ></input>
        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            className="input input-ghost w-full pr-10"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          ></input>
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/50 hover:text-base-content"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button type="submit" className="btn btn-primary mt-2">
          Log In
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-base-content/60">
        Don't have an account?{" "}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onShowSignup) onShowSignup();
          }}
          className="link link-hover text-primary font-medium"
        >
          Sign Up
        </button>
      </div>
    </Card>
  );
};

export default Login;
