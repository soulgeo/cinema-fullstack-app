import { useEffect, useState, useMemo, useRef } from "react";
import { dbApi } from "../../api/db";
import type { Screening, Movie, Hall } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import DateSelector from "../ui/DateSelector";
import MovieCard from "../ui/MovieCard";
import toast from "react-hot-toast";
import { Search, Filter, X } from "lucide-react";
import 'animate.css';

const SearchPage = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [datesWithScreenings, setDatesWithScreenings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState<[number, number]>([0, 30]);
  const [searchQuery, setSearchQuery] = useState("");

  const openDialog = () => {
    setIsClosing(false);
    dialogRef.current?.showModal();
  };

  const closeDialog = () => {
    setIsClosing(true);
    setTimeout(() => {
      dialogRef.current?.close();
      setIsClosing(false);
    }, 200);
  };

  const parseDuration = (durationStr: string): number => {
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 3) {
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    }
    return 0;
  };

  const formatHour = (h: number) => {
    const hour = h % 24;
    return `${hour.toString().padStart(2, '0')}:00${h >= 24 ? ' (+1)' : ''}`;
  };

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        setLoading(true);
        const [moviesData, hallsData, datesData] = await Promise.all([
          dbApi.movies.list(),
          dbApi.halls.list(),
          dbApi.screenings.screeningDates(),
        ]);
        setMovies(moviesData);
        setHalls(hallsData);
        setDatesWithScreenings(new Set(datesData));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load filter options.");
      } finally {
        setLoading(false);
      }
    };
    fetchFilterData();
  }, []);

  useEffect(() => {
    const fetchFilteredScreenings = async () => {
      try {
        setFiltering(true);
        const hallObj = halls.find(h => h.name === selectedHall);
        const data = await dbApi.screenings.list({
          date: selectedDate,
          hall: hallObj?.id,
          genres: selectedGenres.length > 0 ? selectedGenres.join(',') : undefined,
        });
        setScreenings(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load screenings.");
      } finally {
        setFiltering(false);
      }
    };

    if (!loading) {
      fetchFilteredScreenings();
    }
  }, [selectedDate, selectedHall, selectedGenres, loading, halls]);

  const uniqueGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach(m => {
      (m.genres || "").split(',').forEach(g => {
        const trimmed = g.trim();
        if (trimmed) genres.add(trimmed);
      });
    });
    return Array.from(genres).sort();
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const matchingScreenings = screenings.filter(s => {
      // Time range filter
      const startTime = new Date(s.start_time);
      const startHour = startTime.getHours() + startTime.getMinutes() / 60;
      const durationMs = parseDuration(s.movie.duration);
      const durationHours = durationMs / (1000 * 60 * 60);
      const endHour = startHour + durationHours;
      if (startHour < timeRange[0] || endHour > timeRange[1]) return false;

      // Search query filter
      if (searchQuery && !s.movie.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });

    const moviesMap = new Map<number, Movie>();
    matchingScreenings.forEach(s => {
      moviesMap.set(s.movie.id, s.movie);
    });
    
    return Array.from(moviesMap.values());
  }, [screenings, timeRange, searchQuery]);

  if (loading) return <Layout><Loading /></Layout>;

  const filterContentNode = (
    <>
      <DateSelector 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate} 
        datesWithScreenings={datesWithScreenings}
        className="bg-base-100 px-2 py-4 rounded-2xl shadow-lg mb-2"
        small={true}
      />

      <div className="flex flex-col gap-8">
        {/* Hall Filter */}
        <div className="form-control">
          <label className="label">
            <span className="label-text text-sm">Cinema Hall</span>
          </label>
          <select 
            className="select select-bordered w-full focus:outline-none focus:border-primary"
            value={selectedHall}
            onChange={(e) => setSelectedHall(e.target.value)}
          >
            <option value="all">All Halls</option>
            {halls.map(hall => (
              <option key={hall.id} value={hall.name}>{hall.name}</option>
            ))}
          </select>
        </div>

        {/* Time Range Range Slider */}
        <div className="form-control mb-4">
          <label className="label flex justify-between">
            <span className="label-text text-sm">Time Range</span>
            <span className="text-sm opacity-70">
              {formatHour(timeRange[0])} - {formatHour(timeRange[1])}
            </span>
          </label>
          <div className="relative h-6 mt-2 flex items-center">
            <div className="absolute w-full h-2 bg-base-300 rounded-full"></div>
            <div 
              className="absolute h-2 bg-primary rounded-full"
              style={{ 
                left: `${(timeRange[0] / 30) * 100}%`, 
                right: `${100 - (timeRange[1] / 30) * 100}%` 
              }}
            ></div>
            <input 
              type="range" 
              min="0" 
              max="30" 
              value={timeRange[0]} 
              onChange={(e) => {
                const val = Math.min(parseInt(e.target.value), timeRange[1] - 1);
                setTimeRange([val, timeRange[1]]);
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none" 
              step="1"
            />
            <input 
              type="range" 
              min="0" 
              max="30" 
              value={timeRange[1]} 
              onChange={(e) => {
                const val = Math.max(parseInt(e.target.value), timeRange[0] + 1);
                setTimeRange([timeRange[0], val]);
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-none" 
              step="1"
            />
          </div>
          <div className="w-full flex justify-between text-xs px-2 mt-2 opacity-50">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>24:00</span>
            <span>06:00</span>
          </div>
        </div>
      </div>

      {/* Genre Filter */}
      <div className="form-control">
        <label className="label">
          <span className="label-text text-sm">Genres</span>
          {selectedGenres.length > 0 && (
            <button 
              onClick={() => setSelectedGenres([])}
              className="btn btn-ghost btn-xs text-error normal-case"
            >
              Clear all
            </button>
          )}
        </label>
        <div className="flex flex-wrap gap-2 mt-1">
          {uniqueGenres.map(genre => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => {
                  setSelectedGenres(prev => 
                    isSelected 
                      ? prev.filter(g => g !== genre)
                      : [...prev, genre]
                  );
                }}
                className={`badge py-3 px-4 cursor-pointer transition-all border-2 font-medium ${
                  isSelected 
                    ? "badge-primary border-primary" 
                    : "badge-ghost border-base-300 hover:border-primary/50"
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <Layout fullWidth={true}>
      <div className="w-full py-8 flex flex-col gap-8 px-4 sm:px-8 xl:px-24">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">Browse Movies</h1>
            <p className="opacity-70 text-lg">Navigate through our selection of films based on your preferences.</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="Search movies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-12 focus:outline-none focus:border-primary rounded-2xl"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10 pointer-events-none" size={20} />
            </div>
            <button 
              className="btn btn-primary btn-circle lg:hidden flex items-center gap-2"
              onClick={openDialog}
            >
              <Filter size={20} />
            </button>
          </div>
        </header>

        {/* Filter Dialog for Mobile */}
        <dialog
          ref={dialogRef}
          className="m-auto bg-transparent border-none w-full max-w-lg p-3 overflow-visible lg:hidden"
        >
          <div
            className={`bg-base-100 w-full rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-base-300 ${
              isClosing
                ? "animate-subtle-zoom-fade-out"
                : "animate-subtle-zoom-fade"
            }`}
          >
            <div className="p-6 border-b border-base-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Filter size={24} />
                Filters
              </h2>
              <button 
                onClick={closeDialog}
                className="btn btn-ghost btn-circle btn-sm"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-h-[70vh]">
              {filterContentNode}
            </div>
            <div className="p-4 border-t border-base-200 bg-base-200/50">
              <button 
                className="btn btn-primary w-full rounded-2xl"
                onClick={closeDialog}
              >
                Show Results
              </button>
            </div>
          </div>
        </dialog>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar for Desktop */}
          <aside className="hidden lg:flex flex-col gap-1 lg:max-w-80 lg:sticky lg:top-28 lg:h-fit lg:flex-shrink-0">
            {filterContentNode}
          </aside>

          <section className="relative flex-1">
            {filtering && (
              <div className="absolute inset-0 bg-base-100/30 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-3xl">
                <div className="loading loading-spinner loading-lg text-primary"></div>
              </div>
            )}

            {filteredMovies.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-8">
                {filteredMovies.map(movie => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-base-200/50 rounded-3xl border-2 border-dashed border-base-300">
                <span className="text-6xl mb-4">🔍</span>
                <h3 className="text-xl font-bold">No movies found</h3>
                <p className="opacity-60">Try adjusting your filters or searching for something else.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
