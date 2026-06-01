import { createBrowserRouter, RouterProvider, redirect } from "react-router";
import { resolveValue, Toaster } from "react-hot-toast";
import CustomToast from "./components/ui/CustomToast";
import HomePage from "./components/pages/HomePage";
import MoviePage from "./components/pages/MoviePage";
import BookingPage from "./components/pages/BookingPage";
import AccountPage from "./components/pages/AccountPage";
import { AuthProvider } from "./context/AuthContext";
import TicketsPage from "./components/pages/TicketsPage";
import { authApi } from "./api/auth";

const requireAuthLoader = async () => {
  const { user } = await authApi.getSession();
  if (!user) {
    return redirect("/");
  }
  return null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/movies/:id",
    element: <MoviePage />,
  },
  {
    path: "/booking",
    element:<BookingPage />,
  },
  {
    path: "/account",
    element: <AccountPage />,
    loader: requireAuthLoader,
  },
  {
    path: "/tickets",
    element: <TicketsPage />,
    loader: requireAuthLoader,
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
          position="bottom-right"
          containerStyle={{
            bottom: "40px",
            right: "20px",
          }}
          toastOptions={{
            duration: 4000,
          }}
        >
          {(t) => (
            <CustomToast
              t={t}
              message={resolveValue(t.message, t)}
              icon={t.icon}
            />
          )}
        </Toaster>
      </AuthProvider>
  )
}

export default App
