import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { dbApi } from "../../api/db";
import type { Screening, Movie, Hall } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import { Plus, Edit2, Trash2, Calendar, Check, X, ShieldAlert, Tv } from "lucide-react";

// Helper to convert ISO string to local YYYY-MM-DDTHH:MM
const toLocalDatetimeString = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

// Helper to unpack DRF error objects nicely
const extractErrorMessage = (err: unknown): string => {
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const errorObj = err as Record<string, unknown>;
    if (errorObj.detail) return String(errorObj.detail);
    if (errorObj.non_field_errors) {
      if (Array.isArray(errorObj.non_field_errors)) {
        return errorObj.non_field_errors.join(", ");
      }
      return String(errorObj.non_field_errors);
    }
    // Try field errors
    const firstFieldKey = Object.keys(errorObj)[0];
    const firstFieldErr = errorObj[firstFieldKey];
    if (firstFieldErr) {
      const prefix = firstFieldKey !== "detail" ? `${firstFieldKey}: ` : "";
      if (Array.isArray(firstFieldErr)) return `${prefix}${firstFieldErr.join(", ")}`;
      return `${prefix}${String(firstFieldErr)}`;
    }
  }
  return "An unexpected error occurred";
};

const AdminScreenings = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMovie, setFilterMovie] = useState<string>("all");
  const [filterHall, setFilterHall] = useState<string>("all");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScreening, setEditingScreening] = useState<Screening | null>(null);

  // Form fields
  const [movieId, setMovieId] = useState<string>("");
  const [hallId, setHallId] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [basePrice, setBasePrice] = useState<string>("10.00");

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [screeningsData, moviesData, hallsData] = await Promise.all([
          dbApi.screenings.list(),
          dbApi.movies.list(),
          dbApi.halls.list(),
        ]);
        setScreenings(screeningsData);
        setMovies(moviesData.filter((m) => m.is_active));
        setHalls(hallsData);
      } catch {
        toast.error("Failed to load screenings details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingScreening(null);
    setMovieId(movies[0]?.id.toString() || "");
    setHallId(halls[0]?.id.toString() || "");
    setStartTime("");
    setBasePrice("10.00");
    setIsModalOpen(true);
  };

  const openEditModal = (screening: Screening) => {
    setEditingScreening(screening);
    setMovieId(screening.movie.id.toString());
    setHallId(screening.hall.id.toString());
    setStartTime(toLocalDatetimeString(screening.start_time));
    setBasePrice(screening.base_price);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieId || !hallId || !startTime || !basePrice) {
      toast.error("Please fill in all fields");
      return;
    }

    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error("Please enter a valid base price greater than 0");
      return;
    }

    // Convert local datetime-local value to ISO string with timezone offset (standard)
    const isoStartTime = new Date(startTime).toISOString();

    const screeningData = {
      movie: parseInt(movieId),
      hall: parseInt(hallId),
      start_time: isoStartTime,
      base_price: basePrice,
    } as unknown as Partial<Screening>;

    try {
      if (editingScreening) {
        await dbApi.screenings.update(editingScreening.id, screeningData);
        toast.success("Successfully updated screening");
      } else {
        await dbApi.screenings.create(screeningData);
        toast.success("Successfully added screening");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await dbApi.screenings.delete(id);
      toast.success("Successfully deleted screening");
      setDeleteConfirmId(null);
      fetchData();
    } catch {
      toast.error("Failed to delete screening. It may already contain booked tickets.");
    }
  };

  const filteredScreenings = screenings
    .filter((s) => {
      const matchesMovie = filterMovie === "all" || s.movie.id.toString() === filterMovie;
      const matchesHall = filterHall === "all" || s.hall.id.toString() === filterHall;
      return matchesMovie && matchesHall;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  // Formats date nicely
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout fullWidth={true}>
      <div className="w-full p-8 pt-2 flex flex-col gap-6 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-end flex-wrap gap-4 border-b border-base-content/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content tracking-tight">Manage Screenings</h1>
            <p className="text-base-content/70 font-medium">Schedule film screenings and allocate halls</p>
          </div>
          <button
            onClick={openAddModal}
            className="btn btn-primary font-bold flex gap-2"
            disabled={movies.length === 0 || halls.length === 0}
          >
            <Plus size={20} />
            Add Screening
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between bg-base-200 p-4 rounded-2xl border border-base-content/5">
          <div className="flex flex-row flex-wrap gap-4 items-center">
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-[10px] font-black uppercase text-base-content/50">Filter Movie</span>
              </label>
              <select
                className="select select-sm select-bordered w-56 font-semibold bg-base-100 ml-2"
                value={filterMovie}
                onChange={(e) => setFilterMovie(e.target.value)}
              >
                <option value="all">All Movies</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-[10px] font-black uppercase text-base-content/50">Filter Hall</span>
              </label>
              <select
                className="select select-sm select-bordered w-48 font-semibold bg-base-100 ml-2"
                value={filterHall}
                onChange={(e) => setFilterHall(e.target.value)}
              >
                <option value="all">All Halls</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} {h.dolby_atmos ? "(Atmos)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-sm font-bold text-base-content/60">
            Total Matches: {filteredScreenings.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20">
            <Loading size="lg" />
          </div>
        ) : filteredScreenings.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-base-200 text-base-content/40">
              <Calendar size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No screenings found</h3>
              <p className="text-base-content/60 text-sm mt-1">
                {filterMovie !== "all" || filterHall !== "all"
                  ? "Try resetting your search filters."
                  : "Start scheduling screenings for active movies."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full bg-base-100 rounded-2xl shadow border border-base-content/5">
              <thead>
                <tr className="text-base-content/60 border-b border-base-content/10 bg-base-200">
                  <th className="font-extrabold text-xs uppercase tracking-wider text-left pl-6">Movie</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-left">Hall</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-left">Scheduled Time</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-right">Base Price</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-right">Tickets Sold</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-center pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScreenings.map((s) => (
                  <tr key={s.id} className="hover border-b border-base-content/5">
                    <td className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 bg-base-200 rounded-md overflow-hidden flex-shrink-0">
                          {s.movie.poster_url ? (
                            <img src={s.movie.poster_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base-content/30">
                              <Tv size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold text-base-content text-base line-clamp-1">{s.movie.title}</div>
                          <div className="text-xs font-semibold text-base-content/50 uppercase tracking-wider mt-0.5">
                            {s.movie.producer}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-base-content">{s.hall.name}</span>
                        {s.hall.dolby_atmos && (
                          <span className="badge badge-accent badge-xs font-black uppercase text-[8px] tracking-wider px-1">
                            Dolby Atmos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 font-semibold text-base-content/80 text-sm">
                        <Calendar size={14} className="text-primary" />
                        {formatDateTime(s.start_time)}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-black text-primary text-base">
                        ${parseFloat(s.base_price).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-black text-base-content/70">
                        {s.tickets_count !== undefined ? s.tickets_count : 0}
                      </span>
                    </td>
                    <td className="py-4 text-center pr-6">
                      <div className="flex gap-2 justify-center items-center">
                        <button
                          onClick={() => openEditModal(s)}
                          className="btn btn-sm btn-ghost bg-primary/10 text-primary hover:bg-primary/20 p-2 rounded-lg"
                          title="Edit Screening"
                        >
                          <Edit2 size={14} />
                        </button>

                        {deleteConfirmId === s.id ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="btn btn-sm btn-error font-bold px-2.5 rounded-lg"
                              title="Confirm Delete"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="btn btn-sm btn-neutral px-2.5 rounded-lg"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(s.id)}
                            className="btn btn-sm btn-ghost bg-error/10 text-error hover:bg-error/20 p-2 rounded-lg"
                            title="Delete Screening"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal form overlay */}
        {isModalOpen && (
          <div className="modal modal-open z-50">
            <div className="modal-box max-w-lg bg-base-100 border border-base-content/10 rounded-3xl p-8 relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              >
                ✕
              </button>
              <h3 className="font-black text-2xl mb-2 text-base-content">
                {editingScreening ? "Edit Screening Schedule" : "Add Screening"}
              </h3>
              <p className="text-sm text-base-content/60 mb-6 font-semibold">
                Set the movie, hall, and time slots. The backend checks for overlaps.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Movie Selection */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Select Movie *</span>
                  </label>
                  <select
                    className="select select-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                    value={movieId}
                    onChange={(e) => setMovieId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Movie --</option>
                    {movies.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.rating})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hall Selection */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Select Hall *</span>
                  </label>
                  <select
                    className="select select-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                    value={hallId}
                    onChange={(e) => setHallId(e.target.value)}
                    required
                  >
                    <option value="" disabled>-- Select Hall --</option>
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} {h.dolby_atmos ? "(Dolby Atmos)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Start Time */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Start Date & Time *</span>
                  </label>
                  <input
                    type="datetime-local"
                    className="input input-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                {/* Base Price */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Base Ticket Price ($) *</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="input input-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                    placeholder="10.00"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    required
                  />
                </div>

                {/* Warning note */}
                <div className="flex gap-2.5 bg-warning/10 text-warning p-3.5 rounded-2xl border border-warning/20 text-xs font-semibold leading-relaxed">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <span>
                    Note: Screenings cannot overlap in the same hall. The system accounts for the movie's duration when validating availability.
                  </span>
                </div>

                {/* Form Actions */}
                <div className="modal-action border-t border-base-content/5 pt-4 mt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary font-bold px-6">
                    {editingScreening ? "Save Changes" : "Schedule"}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}></div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminScreenings;
