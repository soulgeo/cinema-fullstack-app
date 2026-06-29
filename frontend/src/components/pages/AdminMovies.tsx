import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { dbApi } from "../../api/db";
import type { Movie } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import { Plus, Edit2, Trash2, Search, Film, Check, X, Info } from "lucide-react";

const RATINGS = ["G", "PG", "PG-13", "R", "NC-17"];

const AdminMovies = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  
  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [producer, setProducer] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [rating, setRating] = useState("PG-13");
  const [posterUrl, setPosterUrl] = useState("");
  const [genres, setGenres] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const data = await dbApi.movies.list();
      setMovies(data);
    } catch {
      toast.error("Failed to load movies list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const openAddModal = () => {
    setEditingMovie(null);
    setTitle("");
    setDescription("");
    setProducer("");
    setReleaseDate("");
    setDurationHours(2);
    setDurationMinutes(0);
    setRating("PG-13");
    setPosterUrl("");
    setGenres("");
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setTitle(movie.title);
    setDescription(movie.description);
    setProducer(movie.producer);
    setReleaseDate(movie.release_date);
    setRating(movie.rating);
    setPosterUrl(movie.poster_url || "");
    setGenres(movie.genres);
    setIsActive(movie.is_active);

    // Parse duration string e.g. "02:15:00" or similar
    if (movie.duration) {
      const parts = movie.duration.split(":").map(Number);
      if (parts.length >= 2) {
        setDurationHours(parts[0]);
        setDurationMinutes(parts[1]);
      } else {
        setDurationHours(2);
        setDurationMinutes(0);
      }
    } else {
      setDurationHours(2);
      setDurationMinutes(0);
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !producer.trim() || !releaseDate || !rating) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Format duration to HH:MM:00
    const formattedDuration = `${durationHours.toString().padStart(2, "0")}:${durationMinutes
      .toString()
      .padStart(2, "0")}:00`;

    const movieData: Partial<Movie> = {
      title: title.trim(),
      description: description.trim(),
      producer: producer.trim(),
      release_date: releaseDate,
      duration: formattedDuration,
      rating,
      poster_url: posterUrl.trim() || undefined,
      genres: genres.trim(),
      is_active: isActive,
    };

    try {
      if (editingMovie) {
        await dbApi.movies.update(editingMovie.id, movieData);
        toast.success(`Successfully updated movie: ${title}`);
      } else {
        await dbApi.movies.create(movieData);
        toast.success(`Successfully added movie: ${title}`);
      }
      setIsModalOpen(false);
      fetchMovies();
    } catch (err: any) {
      toast.error(err?.message || "An error occurred while saving the movie");
    }
  };

  const handleDelete = async (id: number, movieTitle: string) => {
    try {
      await dbApi.movies.delete(id);
      toast.success(`Successfully deleted movie: ${movieTitle}`);
      setDeleteConfirmId(null);
      fetchMovies();
    } catch {
      toast.error("Failed to delete movie. It might be linked to existing screenings.");
    }
  };

  const filteredMovies = movies.filter(
    (movie) =>
      movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.genres.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movie.producer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout fullWidth={true}>
      <div className="w-full p-8 pt-2 flex flex-col gap-6 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-end flex-wrap gap-4 border-b border-base-content/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content tracking-tight">Manage Movies</h1>
            <p className="text-base-content/70 font-medium">Add, edit, and deactivate movies in the catalog</p>
          </div>
          <button onClick={openAddModal} className="btn btn-primary font-bold flex gap-2">
            <Plus size={20} />
            Add New Movie
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-row gap-4 justify-between items-center w-full">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/50" size={18} />
            <input
              type="text"
              placeholder="Search movies by title, genre, or producer..."
              className="input input-bordered pl-12 pr-4 py-2 w-full bg-base-200 border-base-content/10 focus:outline-none focus:border-primary font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm font-semibold text-base-content/60">
            Total Movies: {filteredMovies.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20">
            <Loading size="lg" />
          </div>
        ) : filteredMovies.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-base-200 text-base-content/40">
              <Film size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No movies found</h3>
              <p className="text-base-content/60 text-sm mt-1">
                {searchQuery ? "Try refining your search query." : "Get started by adding a new movie."}
              </p>
            </div>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="btn btn-outline btn-sm">
                Clear Search
              </button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <Card
                key={movie.id}
                className={`flex flex-col h-[480px] overflow-hidden border border-base-content/5 relative group transition-all duration-300 ${
                  !movie.is_active ? "opacity-75" : ""
                }`}
              >
                {/* Poster */}
                <div className="w-full h-56 bg-base-300 relative overflow-hidden">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-base-300 text-base-content/30 gap-2">
                      <Film size={48} />
                      <span className="text-xs font-semibold">No Poster Image</span>
                    </div>
                  )}

                  {/* Rating Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-xs font-black rounded-lg border border-white/10">
                    {movie.rating}
                  </span>

                  {/* Active/Inactive Badge */}
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-bold rounded-lg border shadow-sm ${
                      movie.is_active
                        ? "bg-success/20 text-success border-success/30"
                        : "bg-error/20 text-error border-error/30"
                    }`}
                  >
                    {movie.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Body */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="flex flex-col gap-2">
                    <h3 className="font-extrabold text-lg text-base-content line-clamp-1 group-hover:text-primary transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-xs font-bold text-base-content/50 uppercase tracking-wider">
                      {movie.producer}
                    </p>
                    <p className="text-xs text-base-content/70 line-clamp-3 leading-relaxed mt-1">
                      {movie.description}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex justify-between items-center text-xs font-bold border-t border-base-content/5 pt-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base-content/40 uppercase tracking-wider">Release Date</span>
                        <span className="text-base-content/80">{movie.release_date}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-base-content/40 uppercase tracking-wider">Duration</span>
                        <span className="text-base-content/80">
                          {(() => {
                            const parts = movie.duration.split(":");
                            const h = parseInt(parts[0]);
                            const m = parseInt(parts[1]);
                            return `${h}h ${m}m`;
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-1">
                      {movie.genres.split(",").map((g, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-base-200 text-base-content/70 text-[10px] font-bold rounded-md uppercase tracking-wider"
                        >
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions overlay */}
                <div className="p-4 bg-base-200 border-t border-base-content/5 flex gap-2">
                  <button
                    onClick={() => openEditModal(movie)}
                    className="btn btn-sm btn-ghost flex-1 font-bold flex gap-1 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-focus"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>

                  {deleteConfirmId === movie.id ? (
                    <div className="flex gap-1 flex-1">
                      <button
                        onClick={() => handleDelete(movie.id, movie.title)}
                        className="btn btn-sm btn-error font-bold flex-1 flex gap-1"
                      >
                        <Check size={14} />
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="btn btn-sm btn-neutral font-bold"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(movie.id)}
                      className="btn btn-sm btn-ghost flex-1 font-bold flex gap-1 bg-error/10 text-error hover:bg-error/20 hover:text-error-focus"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal form overlay */}
        {isModalOpen && (
          <div className="modal modal-open z-50">
            <div className="modal-box max-w-2xl bg-base-100 border border-base-content/10 rounded-3xl p-8 relative">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              >
                ✕
              </button>
              <h3 className="font-black text-2xl mb-2 text-base-content">
                {editingMovie ? "Edit Movie Details" : "Add New Movie"}
              </h3>
              <p className="text-sm text-base-content/60 mb-6 font-semibold">
                Provide metadata details to register this movie in the catalog
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Title */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Movie Title *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inception"
                    className="input input-bordered w-full bg-base-200 focus:outline-none focus:border-primary font-semibold"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Description *</span>
                  </label>
                  <textarea
                    required
                    placeholder="Enter movie overview plot..."
                    className="textarea textarea-bordered w-full h-24 bg-base-200 focus:outline-none focus:border-primary font-semibold leading-relaxed"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Producer */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs uppercase text-base-content/60">Producer *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Christopher Nolan"
                      className="input input-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                      value={producer}
                      onChange={(e) => setProducer(e.target.value)}
                    />
                  </div>

                  {/* Rating */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs uppercase text-base-content/60">Rating Classification *</span>
                    </label>
                    <select
                      className="select select-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                    >
                      {RATINGS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Release Date */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs uppercase text-base-content/60">Release Date *</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="input input-bordered bg-base-200 focus:outline-none focus:border-primary font-semibold"
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                    />
                  </div>

                  {/* Duration */}
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold text-xs uppercase text-base-content/60">Duration *</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1.5 bg-base-200 rounded-lg border border-base-content/10 px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          className="w-12 bg-transparent text-center focus:outline-none font-bold text-base"
                          value={durationHours}
                          onChange={(e) => setDurationHours(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                        <span className="text-xs font-bold text-base-content/50 uppercase">Hrs</span>
                      </div>
                      <div className="flex-1 flex items-center gap-1.5 bg-base-200 rounded-lg border border-base-content/10 px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          className="w-12 bg-transparent text-center focus:outline-none font-bold text-base"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        />
                        <span className="text-xs font-bold text-base-content/50 uppercase">Mins</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Poster URL */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">Poster Image URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/poster.jpg"
                    className="input input-bordered w-full bg-base-200 focus:outline-none focus:border-primary font-semibold text-sm"
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                  />
                </div>

                {/* Genres */}
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text font-bold text-xs uppercase text-base-content/60">
                      Genres (Comma-separated)
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Action, Sci-Fi, Thriller"
                    className="input input-bordered w-full bg-base-200 focus:outline-none focus:border-primary font-semibold"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                  />
                  <div className="label py-1">
                    <span className="label-text-alt text-base-content/50 font-medium flex gap-1 items-center">
                      <Info size={12} /> Separate multiple genres with commas.
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="form-control w-fit flex-row gap-3 items-center mt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="toggle toggle-primary"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <label htmlFor="isActive" className="cursor-pointer font-bold text-sm text-base-content ml-2">
                    Active (visible in public schedule and searches)
                  </label>
                </div>

                {/* Form Buttons */}
                <div className="modal-action border-t border-base-content/5 pt-4 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary font-bold px-6">
                    {editingMovie ? "Save Changes" : "Create Movie"}
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

export default AdminMovies;
