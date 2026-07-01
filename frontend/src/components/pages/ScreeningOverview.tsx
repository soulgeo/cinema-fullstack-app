import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { dbApi } from "../../api/db";
import type { Screening, Seat, Ticket, User } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Layout from "../layout/Layout";
import Card from "../ui/Card";
import BackButton from "../ui/BackButton";
import { Armchair, Search, User as UserIcon, Calendar, Clock, MapPin, Check } from "lucide-react";
import SeatSelector from "../ui/SeatSelector";

const ScreeningOverview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [screening, setScreening] = useState<Screening | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedClient, setSelectedClient] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const screeningId = parseInt(id);
      const [screeningData, ticketsData] = await Promise.all([
        dbApi.screenings.get(screeningId),
        dbApi.tickets.listByScreening(screeningId),
      ]);
      
      setScreening(screeningData);
      setTickets(ticketsData);
      
      const seatsData = await dbApi.seats.listByHall(screeningData.hall.id);
      setSeats(seatsData);

      // Fetch user info for each ticket in parallel
      const uniqueUserIds = Array.from(new Set(ticketsData.map(t => t.client)));
      const usersData: Record<number, User> = { ...users };
      const missingUserIds = uniqueUserIds.filter(userId => !usersData[userId]);
      
      if (missingUserIds.length > 0) {
        const userPromises = missingUserIds.map(async (userId) => {
          try {
            const userData = await dbApi.users.get(userId);
            return { userId, userData };
          } catch {
            return null;
          }
        });
        
        const results = await Promise.all(userPromises);
        results.forEach((res) => {
          if (res) {
            usersData[res.userId] = res.userData;
          }
        });
      }
      setUsers(usersData);

    } catch {
      toast.error("Failed to fetch screening data");
      navigate("/staff");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, users]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const searchUsers = async () => {
      if (userSearch.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await dbApi.users.list(userSearch);
        setSearchResults(results);
      } catch {
        // Ignore
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [userSearch]);

  const handleSeatClick = (seat: Seat) => {
    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id));
    } else {
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const handleBookTickets = async () => {
    if (!selectedClient || selectedSeats.length === 0 || !screening) return;
    
    setBookingLoading(true);
    try {
      await dbApi.purchases.create({
        client: selectedClient.id,
        tickets: selectedSeats.map(s => ({
          screening: screening.id,
          seat: s.id,
        })),
      });
      
      toast.success(`Successfully booked ${selectedSeats.length} ticket(s) for ${selectedClient.email}`);
      setSelectedSeats([]);
      setSelectedClient(null);
      setUserSearch("");
      fetchData();
    } catch {
      toast.error("Failed to book tickets");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !screening) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  const occupiedSeatIds = new Set(tickets.map(t => t.seat));

  const startTime = new Date(screening.start_time);
  const formattedDate = startTime.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = startTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Layout>
      <div className="w-full py-8">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content: Screening Info & Seat Map */}
          <div className="lg:col-span-2 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{screening.movie.title}</h1>
                <div className="flex flex-wrap gap-4 mt-2 text-base-content/70">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formattedTime}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{screening.hall.name}</span>
                  </div>
                </div>
              </div>
              <div className="bg-base-200 px-4 py-2 rounded-xl text-center">
                <span className="block text-xs font-bold opacity-50 uppercase">Occupancy</span>
                <span className="text-xl font-bold">{tickets.length} / {seats.length}</span>
              </div>
            </header>

            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-base-200 bg-base-100/50">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Armchair className="w-5 h-5 text-primary" />
                  Hall Layout & Occupancy
                </h2>
                <p className="text-sm opacity-60 mt-1">Select available seats to book for a client.</p>
              </div>
              <div className="p-6 overflow-auto">
                <SeatSelector 
                  seats={seats}
                  occupiedSeatIds={occupiedSeatIds}
                  selectedSeats={selectedSeats}
                  onSeatClick={handleSeatClick}
                />
              </div>
            </Card>

            {/* List of occupants for staff */}
            <Card>
              <h3 className="text-lg font-bold mb-4">Current Bookings</h3>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Seat</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Price Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length > 0 ? (
                      tickets.map(ticket => {
                        const seat = seats.find(s => s.id === ticket.seat);
                        const user = users[ticket.client];
                        return (
                          <tr key={ticket.id}>
                            <td className="font-bold">
                              {seat ? `${seat.row_label}${seat.seat_number}` : 'Unknown'}
                            </td>
                            <td>
                              {user ? (
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.first_name} {user.last_name}</span>
                                  <span className="text-xs opacity-60">{user.email}</span>
                                </div>
                              ) : (
                                <span className="opacity-40 italic">Loading user...</span>
                              )}
                            </td>
                            <td>
                               <span className="badge badge-success badge-sm">Booked</span>
                            </td>
                            <td>${ticket.price_paid}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4 opacity-50">No bookings yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Sidebar: Booking Tool */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Quick Booking
              </h2>

              <div className="space-y-4">
                {/* Client Selection */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold">1. Select Client</span>
                  </label>
                  {!selectedClient ? (
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                        <input 
                          type="text" 
                          placeholder="Search by email or name..." 
                          className="input input-bordered w-full pl-10 focus:outline-none focus:border-primary"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      
                      {userSearch.length >= 2 && (
                        <div className="absolute z-10 w-full mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-4 text-center"><span className="loading loading-spinner loading-sm"></span></div>
                          ) : searchResults.length > 0 ? (
                            searchResults.map(user => (
                              <button 
                                key={user.id}
                                className="w-full p-3 text-left hover:bg-base-200 transition-colors flex flex-col border-b border-base-100 last:border-0"
                                onClick={() => setSelectedClient(user)}
                              >
                                <span className="font-bold">{user.first_name} {user.last_name}</span>
                                <span className="text-xs opacity-60">{user.email}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm opacity-50">No users found</div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-xl">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{selectedClient.first_name} {selectedClient.last_name}</span>
                        <span className="text-xs opacity-70">{selectedClient.email}</span>
                      </div>
                      <button 
                        className="btn btn-ghost btn-xs btn-circle"
                        onClick={() => setSelectedClient(null)}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Seat Selection Info */}
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-bold">2. Selected Seats</span>
                  </label>
                  <div className="min-h-[60px] p-3 bg-base-200 rounded-xl flex flex-wrap gap-2 items-center">
                    {selectedSeats.length > 0 ? (
                      selectedSeats.map(seat => (
                        <span key={seat.id} className="badge badge-primary font-bold">
                          {seat.row_label}{seat.seat_number}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm opacity-40 italic px-1">Select seats on the map</span>
                    )}
                  </div>
                </div>

                {/* Summary & Action */}
                {selectedSeats.length > 0 && selectedClient && (
                   <div className="mt-6 p-4 bg-base-200 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-70">Client:</span>
                        <span className="font-bold">{selectedClient.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="opacity-70">Tickets:</span>
                        <span className="font-bold">{selectedSeats.length}</span>
                      </div>
                      <div className="divider my-1"></div>
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total:</span>
                        <span className="text-primary">
                          ${selectedSeats.reduce((sum, s) => {
                            const multiplier = s.seat_type === 'VIP' ? 1.5 : 1.0;
                            return sum + parseFloat(screening.base_price) * multiplier;
                          }, 0).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[10px] opacity-60 leading-tight">
                        Note: This will create a pending purchase for the client. They will need to pay later.
                      </p>
                   </div>
                )}

                <button 
                  className="btn btn-primary w-full mt-4"
                  disabled={!selectedClient || selectedSeats.length === 0 || bookingLoading}
                  onClick={handleBookTickets}
                >
                  {bookingLoading ? <span className="loading loading-spinner"></span> : <Check className="w-4 h-4 mr-2" />}
                  Confirm Booking
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScreeningOverview;
