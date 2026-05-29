import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dbApi } from "../../api/db";
import type { Movie, Screening } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";

const MoviePage = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [movieData, screeningsData] = await Promise.all([
          dbApi.movies.get(parseInt(id)),
          dbApi.screenings.list(parseInt(id)),
        ]);
        setMovie(movieData);
        setScreenings(screeningsData);
      } catch (err) {
        setError("Failed to fetch movie details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  const filteredScreenings = screenings
    .filter((s) => {
      const screeningDate = new Date(s.start_time).toISOString().split("T")[0];
      return screeningDate === selectedDate;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const datesWithScreenings = new Set(
    screenings.map((s) => new Date(s.start_time).toISOString().split("T")[0])
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    // Small delay to ensure onClick doesn't fire if we just finished a drag
    setTimeout(() => {
      setIsDragging(false);
      setHasMoved(false);
    }, 50);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;
    
    // If we moved more than 5 pixels, consider it a drag
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 95;
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
        behavior: "smooth",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  if (error || !movie) {
    return (
      <Layout>
        <div className="alert alert-error mt-10">
          <span>{error || "Movie not found"}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col w-full gap-8 py-8">
        {/* Top Section: Movie Info */}
        <section className="flex flex-col md:flex-row gap-8 bg-base-100 p-6 rounded-2xl shadow-xl">
          <div className="w-full md:w-1/3 lg:w-1/4">
            <div className="aspect-2/3 rounded-xl overflow-hidden shadow-lg bg-base-200">
              {movie.poster_url ? (
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-base-content/50">
                  No Poster
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-wrap items-baseline gap-4">
              <h1 className="text-4xl font-bold">{movie.title}</h1>
              <div className="badge badge-outline badge-lg">{movie.rating}</div>
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-base-content/70">
              <span className="font-semibold">{movie.duration}</span>
              <span>•</span>
              <span>{movie.genres}</span>
              <span>•</span>
              <span>{new Date(movie.release_date).getFullYear()}</span>
            </div>

            <div className="divider my-0"></div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-base-content/80 leading-relaxed">
                {movie.description}
              </p>
            </div>

            <div className="mt-auto pt-4">
              <p className="text-sm">
                <span className="font-semibold">Producer:</span> {movie.producer}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-base-100 p-6 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold mb-6">Available Screenings</h2>

          <div className="flex items-center gap-2 mb-6 w-full">
            <button
              onClick={() => scroll("left")}
              className="btn btn-ghost btn-circle btn-md hidden sm:flex shrink-0"
            >
              <ChevronLeft size={28} />
            </button>

            <div
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className={`overflow-x-auto flex-1 pb-2 scrollbar-hide touch-pan-x select-none ${
                isDragging ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <div className="flex flex-nowrap gap-4 min-w-max px-2">
                {dates.map((date) => {
                  const dateStr = date.toISOString().split("T")[0];
                  const isSelected = dateStr === selectedDate;
                  const hasScreenings = datesWithScreenings.has(dateStr);
                  const dayName = date.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dayNum = date.getDate();
                  const monthName = date.toLocaleDateString("en-US", {
                    month: "short",
                  });

                  return (
                    <button
                      key={dateStr}
                      onClick={() => !hasMoved && setSelectedDate(dateStr)}
                      className={`flex flex-col items-center justify-center min-w-20 p-4 rounded-xl transition-all pointer-events-auto ${

                        isSelected
                          ? "bg-primary text-primary-content shadow-md scale-105"
                          : hasScreenings
                          ? "bg-base-200 hover:bg-base-300"
                          : "bg-base-200 opacity-40 grayscale-50 hover:bg-base-300"
                      }`}
                    >
                      <span className="text-xs uppercase font-bold opacity-70">
                        {dayName}
                      </span>
                      <span className="text-xl font-bold">{dayNum}</span>
                      <span className="text-xs uppercase">{monthName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => scroll("right")}
              className="btn btn-ghost btn-circle btn-md hidden sm:flex shrink-0"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredScreenings.length > 0 ? (
              filteredScreenings.map((screening) => (
                <div
                  key={screening.id}
                  className="flex items-center justify-between p-4 bg-base-200 rounded-xl hover:bg-base-300 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold">
                      {new Date(screening.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-sm opacity-70">
                      Hall: {screening.hall_name || `Hall ${screening.hall}`}
                    </span>
                  </div>
                  <div className="flex flex-row gap-4 items-center justify-end">
                    <span className="text-lg font-semibold">
                      €{screening.base_price}
                    </span>
                    <Link to="/booking" state={screening} className="btn btn-primary">Book Now</Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-10 text-center opacity-50 italic">
                No screenings available for this date.
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default MoviePage;
