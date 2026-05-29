import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import profileImageUrl from "../../../assets/profile.svg";
import Logout from "../../ui/Logout";
import Login from "../../ui/Login";
import Signup from "../../ui/Signup";
import { Link, useLocation } from "react-router";
import 'animate.css';

const UserDropdown = () => {
  const { userLoggedIn, showLogin, setShowLogin, showSignup, setShowSignup } =
    useAuth();
  const location = useLocation();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [mode, setMode] = useState<"login" | "signup" | "logout">("login");

  // Close modal on route change
  useEffect(() => {
    dialogRef.current?.close();
    setShowLogin(false);
    setShowSignup(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClosing(false);
  }, [location.pathname, setShowLogin, setShowSignup]);

  // Keep modal in sync with context state
  useEffect(() => {
    if (showLogin) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("login");
      setIsClosing(false);
    }
  }, [showLogin]);

  useEffect(() => {
    if (showSignup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("signup");
      setIsClosing(false);
    }
  }, [showSignup]);

  useEffect(() => {
    if (userLoggedIn && (showLogin || showSignup)) {
      setShowLogin(false);
      setShowSignup(false);
      dialogRef.current?.close();
    }
  }, [userLoggedIn, showLogin, showSignup, setShowLogin, setShowSignup]);

  useEffect(() => {
    if ((showLogin || showSignup) && !isClosing) {
      dialogRef.current?.showModal();
    }
  }, [showLogin, showSignup, isClosing]);

  const openLogoutModal = () => {
    setMode("logout");
    setIsClosing(false);
    dialogRef.current?.showModal();
  };

  const closeModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      dialogRef.current?.close();
      setIsClosing(false);
      setShowLogin(false);
      setShowSignup(false);
    }, 200);
  };

  const switchToSignup = () => {
    setMode("signup");
    setShowLogin(false);
    setShowSignup(true);
  };

  const switchToLogin = () => {
    setMode("login");
    setShowSignup(false);
    setShowLogin(true);
  };

  return (
    <>
      {userLoggedIn ? (
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
          >
            <div className="w-10 rounded-full">
              <img alt="user_profile" src={profileImageUrl} />
            </div>
          </div>
          <ul
            tabIndex={-1}
            className="menu menu-md dropdown-content bg-base-200 rounded-box mt-3 w-52 p-2 shadow"
          >
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <span onClick={openLogoutModal} className="text-error">
                Sign Out
              </span>
            </li>
          </ul>
        </div>
      ) : (
        <div className="flex flex-row gap-2">
          <button onClick={() => setShowLogin(true)} className="btn btn-ghost">
            Log In
          </button>
          <button onClick={() => setShowSignup(true)} className="btn btn-primary">
            Sign Up
          </button>
        </div>
      )}

      <dialog
        ref={dialogRef}
        className="m-auto bg-transparent border-none w-sm p-3 overflow-visible"
      >
        <div
          className={
            isClosing
              ? "animate-subtle-zoom-fade-out"
              : "animate-subtle-zoom-fade"
          }
        >
          <button
            onClick={closeModal}
            className="btn btn-ghost btn-circle absolute top-3 right-3 z-50"
          >
            ✕
          </button>
          {mode === "logout" && <Logout closeModal={closeModal} />}
          {mode === "login" && (
            <Login closeModal={closeModal} onShowSignup={switchToSignup} />
          )}
          {mode === "signup" && (
            <Signup closeModal={closeModal} onShowLogin={switchToLogin} />
          )}
        </div>
      </dialog>
    </>
  );
};

export default UserDropdown;
