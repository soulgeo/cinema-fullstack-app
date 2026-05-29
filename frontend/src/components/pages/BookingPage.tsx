import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screening = location.state;

  useEffect(() => {
    if (!screening) {
      navigate("/");
    }
  }, [screening, navigate]);

  return (
    <></>
  )
}

export default BookingPage;
