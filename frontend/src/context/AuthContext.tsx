import { createContext, useContext, useEffect, useState, useRef } from "react";
import { authApi } from "../api/auth";
import type { User, LoginCredentials, SignupData } from "../api/types";

interface AuthContextType {
  currentUser: User | null;
  userLoggedIn: boolean;
  loading: boolean;
  showLogin: boolean;
  showSignup: boolean;
  setShowLogin: (show: boolean) => void;
  setShowSignup: (show: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
}

interface Props {
  children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: Props) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const initialized = useRef(false);

  const refreshUser = async () => {
    try {
      const session = await authApi.getSession();
      if (session.user) {
        setCurrentUser(session.user);
        setUserLoggedIn(true);
      } else {
        setCurrentUser(null);
        setUserLoggedIn(false);
      }
    } catch (error) {
      setCurrentUser(null);
      setUserLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      refreshUser();
    }
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const res = await authApi.login(credentials);
    if (res.data?.user) {
      setCurrentUser(res.data.user);
      setUserLoggedIn(true);
    }
  };

  const signup = async (data: SignupData) => {
    const res = await authApi.signup(data);
    if (res.data?.user) {
      setCurrentUser(res.data.user);
      setUserLoggedIn(true);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setCurrentUser(null);
    setUserLoggedIn(false);
  };

  const value = {
    currentUser,
    userLoggedIn,
    loading,
    showLogin,
    showSignup,
    setShowLogin,
    setShowSignup,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
