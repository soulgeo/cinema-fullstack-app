import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { dbApi } from "../../api/db";
import type { RichTicket } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import { toast } from "react-hot-toast";
import BackButton from "../ui/BackButton";
import { ChevronDown, RefreshCw, X } from "lucide-react";
import Card from "../ui/Card";

const TicketsPage = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<RichTicket[]>([]);
  const [reissueTickets, setReissueTickets] = useState<RichTicket[]>([]);
  const reissueDialogRef = useRef<HTMLDialogElement>(null);

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

  const upcomingScreenings: [string, RichTicket[]][] = [];
  const pastScreenings: [string, RichTicket[]][] = [];
  const now = new Date();

  Object.entries(ticketsByScreening).forEach(([screeningId, screeningTickets]) => {
    const screening = screeningTickets[0].screening;
    if (new Date(screening.start_time) > now) {
      upcomingScreenings.push([screeningId, screeningTickets]);
    } else {
      pastScreenings.push([screeningId, screeningTickets]);
    }
  });

  upcomingScreenings.sort((a, b) => new Date(a[1][0].screening.start_time).getTime() - new Date(b[1][0].screening.start_time).getTime());
  pastScreenings.sort((a, b) => new Date(b[1][0].screening.start_time).getTime() - new Date(a[1][0].screening.start_time).getTime());

  const openReissueModal = (ticketsToReissue: RichTicket[]) => {
    setReissueTickets(ticketsToReissue);
    reissueDialogRef.current?.showModal();
  };

  const closeReissueModal = () => {
    reissueDialogRef.current?.close();
    setReissueTickets([]);
  };

  const confirmReissue = async () => {
    if (reissueTickets.length === 0) return;
    
    const reissuePromises = reissueTickets.map(t => dbApi.tickets.reissue(t.id));
    
    toast.promise(Promise.all(reissuePromises), {
      loading: reissueTickets.length > 1 ? `Reissuing ${reissueTickets.length} tickets...` : "Reissuing ticket...",
      success: reissueTickets.length > 1 ? "Tickets reissued! Check your email." : "Ticket reissued! Check your email.",
      error: reissueTickets.length > 1 ? "Failed to reissue tickets." : "Failed to reissue ticket.",
    });

    try {
      await Promise.all(reissuePromises);
      closeReissueModal();
    } catch (err) {
      console.error(err);
    }
  };

  const renderScreening = ([screeningId, screeningTickets]: [string, RichTicket[]]) => {
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="font-bold opacity-90 text-sm uppercase tracking-wide">
                Booked Seats ({screeningTickets.length})
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => openReissueModal(screeningTickets)}
                  className="btn btn-xs btn-outline gap-1"
                >
                  <RefreshCw size={12} />
                  Reissue All
                </button>
                <button 
                  className="btn btn-xs btn-outline btn-error gap-1"
                >
                  <X size={12} />
                  Cancel All
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {screeningTickets.map(ticket => {
                const seat = ticket.seat;
                const isVIP = seat.seat_type === 'VIP';
                return (
                  <div key={ticket.id} className="dropdown dropdown-bottom dropdown-end">
                    <div 
                      tabIndex={0} 
                      role="button" 
                      className={`badge badge-lg py-4 pl-4 pr-3 font-semibold shadow-sm flex items-center gap-1 transition-colors hover:opacity-90 cursor-pointer ${isVIP ? 'badge-neutral' : 'badge-accent'}`}
                    >
                      {seat.row_label}{seat.seat_number} {isVIP && ' (VIP)'}
                      <ChevronDown size={14} className="opacity-70 ml-1" strokeWidth={2.5} />
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow bg-base-200 rounded-box w-52 mt-1">
                      <li>
                        <button onClick={() => openReissueModal([ticket])} className="flex items-center gap-2">
                          <RefreshCw size={16} />
                          Reissue Ticket
                        </button>
                      </li>
                      <li>
                        <button className="flex items-center gap-2 text-error">
                          <X size={16} />
                          Cancel Ticket
                        </button>
                      </li>
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="w-full flex flex-col gap-4 mx-auto py-4">
        <div className="flex flex-col gap-2">
          <BackButton />
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-base-content/70">View your tickets for upcoming and past screenings</p>
        </div>
        {tickets.length === 0 ? (
          <div className="bg-base-100 p-8 rounded-2xl shadow-lg text-center flex flex-col items-center justify-center min-h-[40vh]">
            <h2 className="text-2xl font-bold mb-4">No tickets found</h2>
            <p className="opacity-70 mb-8 max-w-md">You haven't purchased any tickets yet. Browse our current movies to book your next cinematic experience.</p>
            <Link to="/" className="btn btn-primary btn-lg">Browse Movies</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <details className="collapse collapse-arrow bg-base-200 !overflow-visible relative focus-within:z-50" open={upcomingScreenings.length > 0}>
              <summary className="collapse-title text-md font-light">
                Upcoming ({upcomingScreenings.length})
              </summary>
              <div className="collapse-content flex flex-col gap-6 pt-4 !overflow-visible">
                {upcomingScreenings.length > 0 ? upcomingScreenings.map(renderScreening) : <p className="opacity-70 italic py-4">No upcoming screenings.</p>}
              </div>
            </details>

            <details className="collapse collapse-arrow bg-base-200 !overflow-visible relative focus-within:z-50" open={upcomingScreenings.length === 0 && pastScreenings.length > 0}>
              <summary className="collapse-title text-md font-light">
                Past Screenings ({pastScreenings.length})
              </summary>
              <div className="collapse-content flex flex-col gap-6 pt-4 !overflow-visible">
                {pastScreenings.length > 0 ? pastScreenings.map(renderScreening) : <p className="opacity-70 italic py-4">No past screenings.</p>}
              </div>
            </details>
          </div>
        )}
      </div>

      <dialog 
        ref={reissueDialogRef} 
        onClose={closeReissueModal}
        className="m-auto bg-transparent border-none w-sm p-3 overflow-visible"
      >
        <div className="animate-subtle-zoom-fade">
          <button
            onClick={closeReissueModal}
            className="btn btn-ghost btn-circle absolute top-3 right-3 z-50"
          >
            ✕
          </button>
          <Card>
            <div className="w-full p-2 text-center font-bold">
              {reissueTickets.length > 1 ? `Reissue ${reissueTickets.length} Tickets?` : "Reissue Ticket?"}
            </div>
            <p className="text-center text-sm opacity-70">
              {reissueTickets.length > 1 
                ? "New tickets will be sent to your email. All old ones will become invalid." 
                : "A new ticket will be sent to your email. The old one will become invalid."}
            </p>
            <button className="btn btn-primary mt-2 w-full" onClick={confirmReissue}>
              Confirm Reissue
            </button>
          </Card>
        </div>
      </dialog>
    </Layout>
  );
};

export default TicketsPage;
