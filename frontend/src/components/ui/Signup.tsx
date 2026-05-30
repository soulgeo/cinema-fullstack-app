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
  next?: string;
}

const Signup = ({ closeModal, onShowLogin, next }: SignupProps) => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const onSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error("Passwords do not match");
      return;
    }

    const signupPromise = signup({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
      date_of_birth: dateOfBirth,
    });

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
      navigate(next ?? "/");
    } catch {
      // Error handled by toast
    }
  };

  return (
    <Card>
      <div className="w- p-2 text-center font-bold">Sign Up</div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-base-content/60 ml-1">Email</label>
          <input
            type="email"
            className="input bg-base-200 w-full focus:outline-none focus:border-primary"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          ></input>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-base-content/60 ml-1">First Name</label>
            <input
              type="text"
              className="input bg-base-200 w-full focus:outline-none focus:border-primary"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            ></input>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-base-content/60 ml-1">Last Name</label>
            <input
              type="text"
              className="input bg-base-200 w-full focus:outline-none focus:border-primary"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            ></input>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-base-content/60 ml-1">Phone Number</label>
          <input
            type="tel"
            className="input bg-base-200 w-full focus:outline-none focus:border-primary"
            placeholder="Phone Number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          ></input>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-base-content/60 ml-1">Date of Birth</label>
          <input
            type="date"
            className="input bg-base-200 w-full focus:outline-none focus:border-primary"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          ></input>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-base-content/60 ml-1">Password</label>
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              className="input bg-base-200 w-full pr-10 focus:outline-none focus:border-primary"
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
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-base-content/60 ml-1">Confirm Password</label>
          <div className="relative w-full">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="input bg-base-200 w-full pr-10 focus:outline-none focus:border-primary"
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
