import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { dbApi } from "../../api/db";
import type { Screening, Seat, Ticket } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import { toast } from "react-hot-toast";
import { Info, Armchair } from "lucide-react";
import BackButton from "../ui/BackButton";

const BookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const screening = location.state as Screening;

  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [occupiedSeatIds, setOccupiedSeatIds] = useState<Set<number>>(new Set());
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
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
      // Create tickets for each selected seat
      await Promise.all(
        selectedSeats.map((seat) =>
          dbApi.tickets.create({
            screening: screening.id,
            seat: seat.id,
          })
        )
      );
      toast.success("Tickets booked successfully!");
      navigate("/");
    } catch (err) {
      toast.error("Failed to book tickets. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!screening) return null;

  // Group seats by row for rendering
  const rows: Record<string, Seat[]> = {};
  seats.forEach((seat) => {
    if (!rows[seat.row_label]) rows[seat.row_label] = [];
    rows[seat.row_label].push(seat);
  });
  // Sort seats within rows by number
  Object.values(rows).forEach(rowSeats => rowSeats.sort((a, b) => a.seat_number - b.seat_number));
  // Sort rows alphabetically
  const sortedRowLabels = Object.keys(rows).sort();

  return (
    <Layout>
      <div className="w-full max-w-6xl py-8 flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <BackButton text="Back to Movie"/>
          <h1 className="text-3xl font-bold">Book Your Tickets</h1>
          <p className="text-base-content/70">
            {screening.movie_title} • {new Date(screening.start_time).toLocaleString([], { 
              weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Selection */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <section className="bg-base-100 p-4 sm:p-6 rounded-2xl shadow-lg flex flex-col items-center">
              <h2 className="text-xl font-bold self-start mb-8">Pick your seats</h2>
              
              <div className="w-full overflow-x-auto pb-2 touch-pan-x">
                <div className="inline-flex flex-col items-center min-w-full py-4 px-0">
                  {/* Screen visualization */}
                  <div className="flex flex-col items-center mb-8 w-full max-w-4xl">
                    <div className="w-full h-1.5 bg-base-300 rounded-full shadow-inner mb-4"></div>
                    <span className="text-sm font-black uppercase tracking-[0.6em] text-primary">SCREEN</span>
                  </div>

                  {/* Grid */}
                  <div className="flex flex-col gap-1 sm:gap-2 mb-2">

                    {sortedRowLabels.map((rowLabel, rowIndex) => (
                      <div key={rowLabel} className="flex flex-col gap-1 sm:gap-2">
                        {/* Horizontal Aisle/Stair every 4 rows */}
                        {rowIndex > 0 && rowIndex % 4 === 0 && <div className="h-1 sm:h-1.5" />}
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className="w-4 sm:w-6 text-[10px] sm:text-xs font-bold opacity-60 text-right shrink-0">{rowLabel}</span>
                          <div className="flex gap-0.5 sm:gap-1">
                            {rows[rowLabel].map((seat, seatIndex) => {
                              const isOccupied = occupiedSeatIds.has(seat.id);
                              const isSelected = selectedSeats.find(s => s.id === seat.id);
                              const isVIP = seat.seat_type === "VIP";
                              
                              // Dynamic aisle positioning - add gap every ~6-8 seats
                              const needsVerticalAisle = seatIndex > 0 && (
                                (rows[rowLabel].length > 12 && (seatIndex === 4 || seatIndex === rows[rowLabel].length - 4)) ||
                                (rows[rowLabel].length <= 12 && seatIndex === Math.floor(rows[rowLabel].length / 2))
                              );

                              return (
                                <div key={seat.id} className="flex items-center gap-0.5 sm:gap-1">
                                  {needsVerticalAisle && <div className="w-1 sm:w-1.5" />}
                                  <button
                                    disabled={isOccupied}
                                    onClick={() => handleSeatClick(seat)}
                                    className={`
                                      w-5 h-5 sm:w-7 sm:h-7 rounded-sm sm:rounded-md flex items-center justify-center transition-all relative group
                                      ${isOccupied ? "bg-base-300 cursor-not-allowed opacity-30" : 
                                        isSelected ? "bg-primary text-primary-content scale-110 shadow-lg" : 
                                        isVIP ? "bg-warning/10 border border-warning/30 hover:bg-warning/20 text-warning/70" : "bg-base-200 hover:bg-base-300 text-base-content/40 hover:text-base-content"}
                                    `}
                                    title={`${rowLabel}${seat.seat_number} - ${seat.seat_type}`}
                                  >
                                    <Armchair className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    {isVIP && !isSelected && !isOccupied && (
                                      <div className="absolute -top-0.5 -right-0.5 w-1 h-1 sm:w-2 sm:h-2 bg-warning rounded-full shadow-sm"></div>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <span className="w-4 sm:w-6 text-[10px] sm:text-xs font-bold opacity-60 text-left shrink-0">{rowLabel}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 text-sm mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-base-200"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-base-300 opacity-40"></div>
                  <span>Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-warning/40 bg-warning/20"></div>
                  <span>VIP (+50%)</span>
                </div>
              </div>
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

              <button 
                className={`btn btn-primary btn-lg w-full ${isSubmitting ? "loading" : ""}`}
                disabled={selectedSeats.length < 1 || isSubmitting}
                onClick={handleConfirm}
              >
                {isSubmitting ? "Processing..." : "Confirm & Pay"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingPage;
