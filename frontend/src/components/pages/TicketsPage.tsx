import { useEffect, useState } from "react";
import { Link } from "react-router";
import { dbApi } from "../../api/db";
import type { RichTicket } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import { toast } from "react-hot-toast";
import BackButton from "../ui/BackButton";

const TicketsPage = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<RichTicket[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ticketsData = await dbApi.tickets.myTickets();
        setTickets(ticketsData);
      } catch (err) {
        toast.error("Failed to load tickets.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) return <Layout><Loading /></Layout>;

  // Group tickets by screening
  const ticketsByScreening: Record<number, RichTicket[]> = {};
  tickets.forEach(ticket => {
    if (!ticketsByScreening[ticket.screening.id]) {
      ticketsByScreening[ticket.screening.id] = [];
    }
    ticketsByScreening[ticket.screening.id].push(ticket);
  });

  return (
    <Layout>
      <div className="w-full flex flex-col gap-4 mx-auto py-4">
        <div className="flex flex-col gap-2">
          <BackButton />
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-base-content/70">View your tickets for upcoming screenings</p>
        </div>
        {tickets.length === 0 ? (
          <div className="bg-base-100 p-8 rounded-2xl shadow-lg text-center flex flex-col items-center justify-center min-h-[40vh]">
            <h2 className="text-2xl font-bold mb-4">No tickets found</h2>
            <p className="opacity-70 mb-8 max-w-md">You haven't purchased any tickets yet. Browse our current movies to book your next cinematic experience.</p>
            <Link to="/" className="btn btn-primary btn-lg">Browse Movies</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(ticketsByScreening).map(([screeningId, screeningTickets]) => {
              const screening = screeningTickets[0].screening;
              const movie = screening.movie;

              return (
                <div key={screeningId} className="bg-base-100 p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row gap-6 hover:shadow-xl transition-shadow">
                  {/* Movie Poster */}
                  <div className="shrink-0 w-full sm:w-32 md:w-48 aspect-2/3 rounded-xl overflow-hidden bg-base-300">
                    {movie.poster_url ? (
                      <img src={movie.poster_url} alt={movie.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-50 text-sm">No Poster</div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col flex-1 gap-4 py-2">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{movie.title}</h2>
                      <p className="opacity-80 font-medium mb-1 text-primary">
                        {new Date(screening.start_time).toLocaleString([], { 
                          weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                      <p className="opacity-70 text-sm flex items-center gap-1">
                        <span className="font-semibold">Hall:</span> {screening.hall.name}
                      </p>
                    </div>

                    {/* Tickets/Seats */}
                    <div className="mt-auto">
                      <h3 className="font-bold mb-3 opacity-90 text-sm uppercase tracking-wide">
                        Booked Seats ({screeningTickets.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {screeningTickets.map(ticket => {
                          const seat = ticket.seat;
                          const isVIP = seat.seat_type === 'VIP';
                          return (
                            <div 
                              key={ticket.id} 
                              className={`badge badge-lg py-4 px-4 font-semibold shadow-sm ${isVIP ? 'badge-warning' : 'badge-primary'}`}
                            >
                              Row {seat.row_label}, Seat {seat.seat_number} {isVIP && ' (VIP)'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TicketsPage;
