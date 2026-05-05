export type User = {
  id: string;
  email: string;
  display_name?: string;
};

export type AuthError = {
  message: string;
  code: string;
  param?: string;
};

export type AuthResponse = {
  status: number;
  data?: {
    user?: User;
    methods?: string[];
  };
  errors?: AuthError[];
};

export type LoginCredentials = {
  email?: string;
  password?: string;
};

export type SignupData = {
  email?: string;
  password?: string;
};
