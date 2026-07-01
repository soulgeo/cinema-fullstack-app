import { createBrowserRouter, RouterProvider, redirect } from "react-router";
import { resolveValue, Toaster } from "react-hot-toast";
import CustomToast from "./components/ui/CustomToast";
import HomePage from "./components/pages/HomePage";
import MoviePage from "./components/pages/MoviePage";
import BookingPage from "./components/pages/BookingPage";
import AccountPage from "./components/pages/AccountPage";
import { AuthProvider } from "./context/AuthContext";
import TicketsPage from "./components/pages/TicketsPage";
import PurchasesPage from "./components/pages/PurchasesPage";
import PaymentPage from "./components/pages/PaymentPage";
import { authApi } from "./api/auth";
import StaffDashboard from "./components/pages/StaffDashboard";
import ScreeningOverview from "./components/pages/ScreeningOverview";
import SearchPage from "./components/pages/SearchPage";
import ScanTickets from "./components/pages/ScanTickets";
import StaffPurchases from "./components/pages/StaffPurchases";
import AdminPanel from "./components/pages/AdminPanel";
import AdminMovies from "./components/pages/AdminMovies";
import AdminScreenings from "./components/pages/AdminScreenings";
import AdminHalls from "./components/pages/AdminHalls";


const requireAuthLoader = async () => {
  const { user } = await authApi.getSession();
  if (!user) {
    return redirect("/");
  }
  return null;
};

const requireStaffLoader = async () => {
  const { user } = await authApi.getSession();
  if (!user?.is_staff) {
    return redirect("/");
  }
  return null;
}

const requireAdminLoader = async () => {
  const { user } = await authApi.getSession();
  if (!user?.is_admin) {
    return redirect("/");
  }
  return null;
}

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
  },
  {
    path: "/purchases",
    element: <PurchasesPage />,
    loader: requireAuthLoader,
  },
  {
    path: "/payment/:purchaseId",
    element: <PaymentPage />,
    loader: requireAuthLoader,
  },
  {
    path: "/search",
    element: <SearchPage />,
  },
  {
    path: "/staff",
    element: <StaffDashboard />,
    loader: requireStaffLoader,
  },
  {
    path: "/staff/screenings/:id",
    element: <ScreeningOverview />,
    loader: requireStaffLoader,
  },
  {
    path: "/staff/scan",
    element: <ScanTickets />,
    loader: requireStaffLoader,
  },
  {
    path: "/staff/purchases",
    element: <StaffPurchases />,
    loader: requireStaffLoader,
  },
  {
    path: "/admin",
    element: <AdminPanel />,
    loader: requireAdminLoader,
  },
  {
    path: "/admin/movies",
    element: <AdminMovies />,
    loader: requireAdminLoader,
  },
  {
    path: "/admin/screenings",
    element: <AdminScreenings />,
    loader: requireAdminLoader,
  },
  {
    path: "/admin/halls",
    element: <AdminHalls />,
    loader: requireAdminLoader,
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
