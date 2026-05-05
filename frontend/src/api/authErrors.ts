import type { AuthResponse } from "./types";

export const getAuthErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    const authError = error as AuthResponse;
    if (authError.errors && Array.isArray(authError.errors) && authError.errors.length > 0) {
      // Return the first error message
      const firstError = authError.errors[0];
      return firstError.message || "An error occurred during authentication.";
    }
  }
  
  if (typeof error === "string") {
    return error;
  }

  return "An unexpected error occurred. Please try again.";
};
