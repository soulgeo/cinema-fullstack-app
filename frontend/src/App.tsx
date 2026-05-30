import { createBrowserRouter, RouterProvider } from "react-router";
import { resolveValue, Toaster } from "react-hot-toast";
import CustomToast from "./components/ui/CustomToast";
import HomePage from "./components/pages/HomePage";
import MoviePage from "./components/pages/MoviePage";
import BookingPage from "./components/pages/BookingPage";
import AccountPage from "./components/pages/AccountPage";
import { AuthProvider } from "./context/AuthContext";

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
