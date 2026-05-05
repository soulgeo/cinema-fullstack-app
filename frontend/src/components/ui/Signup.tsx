import Card from "../ui/Card";
import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { getAuthErrorMessage } from "../../api/authErrors";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SignupProps {
  closeModal?: () => void;
  onShowLogin?: () => void;
}

const Signup = ({ closeModal, onShowLogin }: SignupProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error("Passwords do not match");
      return;
    }

    const signupPromise = signup({ email, password });

    toast.promise(signupPromise, {
      loading: "Creating account...",
      success: "Account created successfully!",
      error: (err) => getAuthErrorMessage(err),
    });

    try {
      await signupPromise;
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
      <div className="w-full p-2 text-center font-bold">Sign Up</div>
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
        <div className="relative w-full">
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="input input-ghost w-full pr-10"
            placeholder="Confirm Password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          ></input>
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/50 hover:text-base-content"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <button type="submit" className="btn btn-primary mt-2">
          Sign Up
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-base-content/60">
        Already have an account?{" "}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onShowLogin) onShowLogin();
          }}
          className="link link-hover text-primary font-medium"
        >
          Log In
        </button>
      </div>
    </Card>
  );
};

export default Signup;
