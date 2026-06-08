import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { dbApi } from "../../api/db";
import type { Screening, Seat, Ticket } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import { toast } from "react-hot-toast";
import { Info } from "lucide-react";
import BackButton from "../ui/BackButton";
import SeatSelector from "../ui/SeatSelector";

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screening = location.state as Screening;

  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [occupiedSeatIds, setOccupiedSeatIds] = useState<Set<number>>(new Set());
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [payAtVenue, setPayAtVenue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!screening) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all seats in the hall and all tickets for this screening
        const [allSeats, screeningTickets] = await Promise.all([
          dbApi.seats.listByHall(screening.hall.id),
          dbApi.tickets.listByScreening?.(screening.id)
        ]);

        setSeats(allSeats);
        const occupied = new Set(screeningTickets.map((t: Ticket) => t.seat));
        setOccupiedSeatIds(occupied);
      } catch (err) {
        toast.error("Failed to load seating information");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [screening, navigate]);

  const handleSeatClick = (seat: Seat) => {
    if (occupiedSeatIds.has(seat.id)) return;

    setSelectedSeats((prev) => {
      const isSelected = prev.find((s) => s.id === seat.id);
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id);
      }
      return [...prev, seat];
    });
  };

  const calculateTotal = () => {
    return selectedSeats.reduce((acc, seat) => {
      const multiplier = seat.seat_type === "VIP" ? 1.5 : 1.0;
      return acc + parseFloat(screening.base_price) * multiplier;
    }, 0);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      // Create a single purchase for all selected seats
      const purchase = await dbApi.purchases.create({
        tickets: selectedSeats.map((seat) => ({
          screening: screening.id,
          seat: seat.id,
        })),
      });
      toast.success("Tickets booked successfully!");
      
      if (payAtVenue) {
        navigate("/purchases");
      } else {
        navigate(`/payment/${purchase.id}`);
      }
    } catch (err) {
      toast.error("Failed to book tickets. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!screening) return null;

  return (
    <Layout>
      <div className="w-full max-w-6xl py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <BackButton text="Back to Movie"/>
          <h1 className="text-3xl font-bold">Book Your Tickets</h1>
          <p className="text-base-content/70">
            {screening.movie.title} • {new Date(screening.start_time).toLocaleString([], { 
              weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Selection */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-base-100 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <h2 className="text-xl font-bold self-start mb-8">Pick your seats</h2>
              
              <SeatSelector 
                seats={seats}
                occupiedSeatIds={occupiedSeatIds}
                selectedSeats={selectedSeats}
                onSeatClick={handleSeatClick}
              />
            </section>
          </div>

          {/* Sidebar Confirmation */}
          <div className="flex flex-col gap-6">
            <section className="bg-base-100 p-6 rounded-2xl shadow-lg flex flex-col gap-6 sticky top-24">
              <h2 className="text-xl font-bold">Confirm Selection</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between text-sm">
                  <span className="opacity-60">Seats Selected</span>
                  <span className="font-bold">
                    {selectedSeats.length > 0 
                      ? selectedSeats.map(s => `${s.row_label}${s.seat_number}`).join(", ") 
                      : "None"}
                  </span>
                </div>
                <div className="divider my-0"></div>
                <div className="flex justify-between items-baseline">
                  <span className="text-lg font-bold">Total Price</span>
                  <span className="text-2xl font-bold text-primary">€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-info/10 p-4 rounded-xl flex gap-3 text-sm text-info">
                <Info size={20} className="shrink-0" />
                <p>Please review your selection. Tickets are non-refundable once purchased.</p>
              </div>

              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input 
                    type="checkbox" 
                    className="checkbox checkbox-primary checkbox-sm rounded-md" 
                    checked={payAtVenue}
                    onChange={(e) => setPayAtVenue(e.target.checked)}
                  />
                  <span className="label-text font-medium text-base-content/70">I'll pay at the venue</span>
                </label>
              </div>

              <button 
                className={`btn btn-primary btn-lg w-full ${isSubmitting ? "loading" : ""}`}
                disabled={selectedSeats.length < 1 || isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? "Processing..." : payAtVenue ? "Confirm Booking" : "Confirm & Pay"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingPage;
