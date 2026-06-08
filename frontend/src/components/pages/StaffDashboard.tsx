import { useEffect, useState } from "react";
import { dbApi } from "../../api/db";
import type { Screening } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import Layout from "../layout/Layout";
import DateSelector from "../ui/DateSelector";
import { Link } from "react-router";

const StaffDashboard = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedMovie, setSelectedMovie] = useState<string>("all");
  const [selectedHall, setSelectedHall] = useState<string>("all");
  const [showCompleted, setShowCompleted] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const screeningsData = await dbApi.screenings.list();
        setScreenings(screeningsData);
      } catch {
        const err = "Failed to fetch dashboard data";
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const parseDuration = (durationStr: string | undefined): number => {
    if (!durationStr) return 0;
    const parts = durationStr.split(":").map(Number);
    if (parts.length === 3) {
      return (parts[0] * 3600 + parts[1] * 60 + parts[2]) * 1000;
    }
    return 0;
  };

  const getScreeningStatus = (
    screening: Screening
  ): "complete" | "playing" | "future" => {
    const start = new Date(screening.start_time).getTime();
    const duration = parseDuration(screening.movie.duration);
    const end = start + duration;
    const now = currentTime.getTime();

    if (now > end) return "complete";
    if (now >= start && now <= end) return "playing";
    return "future";
  };

  const filteredScreenings = screenings
    .filter((s) => {
      const screeningDate = new Date(s.start_time).toISOString().split("T")[0];
      const matchesDate = screeningDate === selectedDate;
      const matchesMovie =
        selectedMovie === "all" || s.movie.title === selectedMovie;
      const matchesHall = selectedHall === "all" || s.hall.name === selectedHall;

      const status = getScreeningStatus(s);
      const matchesCompleted = showCompleted || status !== "complete";

      return matchesDate && matchesMovie && matchesHall && matchesCompleted;
    })
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  const datesWithScreenings = new Set(
    screenings.map((s) => new Date(s.start_time).toISOString().split("T")[0])
  );

  const uniqueMovies = Array.from(
    new Map(screenings.map((s) => [s.movie.id, s.movie])).values()
  ).sort((a, b) => a.title.localeCompare(b.title));

  const uniqueHalls = Array.from(
    new Map(screenings.map((s) => [s.hall.id, s.hall])).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">Staff Dashboard</h1>
          <p className="text-base-content/70">Screenings Overview</p>
        </header>

        <DateSelector
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          datesWithScreenings={datesWithScreenings}
          className="mb-6"
        />

        <div className="flex flex-row gap-4 mb-4">
          <div className="form-control flex-1">
            <label className="label">
              <span className="label-text font-bold">Filter by Movie</span>
            </label>
            <select 
              className="select select-bordered w-full focus:outline-none focus:border-primary" 
              value={selectedMovie}
              onChange={(e) => setSelectedMovie(e.target.value)}
            >
              <option value="all">All Movies</option>
              {uniqueMovies.map(movie => (
                <option key={movie.id} value={movie.title}>{movie.title}</option>
              ))}
            </select>
          </div>

          <div className="form-control flex-1">
            <label className="label">
              <span className="label-text font-bold">Filter by Hall</span>
            </label>
            <select 
              className="select select-bordered w-full focus:outline-none focus:border-primary"
              value={selectedHall}
              onChange={(e) => setSelectedHall(e.target.value)}
            >
              <option value="all">All Halls</option>
              {uniqueHalls.map(hall => (
                <option key={hall.id} value={hall.name}>{hall.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          <input
            type="checkbox"
            className="toggle toggle-primary"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span className="label-text">Show Completed Screenings</span>
        </div>

        {filteredScreenings.length > 0 ? (
          <div className="flex flex-col gap-4 mx-auto">
            {filteredScreenings.map((screening) => {
                const rows = screening.hall.rows_count;
                const cols = screening.hall.cols_count;
                const totalSeats = rows * cols;
                const soldTickets = screening.tickets_count || 0;
                const availableSeats = totalSeats - soldTickets;
                
                const startTime = new Date(screening.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const status = getScreeningStatus(screening);

                return (
                  <Link key={screening.id} to={`/staff/screenings/${screening.id}`}>
                    <Card>
                      <div
                        className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-opacity ${
                          status === "complete" ? "opacity-40 grayscale" : ""
                        }`}
                      >
                        <div className="flex flex-row items-center gap-6">
                          <div className="flex flex-col items-center min-w-30">
                            <span
                              className={`text-2xl font-bold ${
                                status === "playing"
                                  ? "text-primary"
                                  : ""
                              }`}
                            >
                              {" "}
                              {startTime}{" "}
                            </span>
                            {status === "playing" && (
                              <span className="badge badge-error badge-sm font-bold mt-1">
                                PLAYING
                              </span>
                            )}
                            {status === "complete" && (
                              <span className="badge badge-ghost badge-sm font-bold opacity-70 mt-1">
                                COMPLETE
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 mt-1">
                            <h3 className="text-xl font-bold">
                              {screening.movie.title}
                            </h3>
                            <span className="text-sm opacity-70">
                              in {screening.hall.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col md:items-end gap-1 flex-1 md:max-w-xs">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-medium opacity-70">
                              Occupancy ({soldTickets}/{totalSeats})
                            </span>
                            {status !== "complete" && (
                              <span
                                className={`text-sm font-bold ${
                                  availableSeats === 0
                                    ? "text-error"
                                    : "text-success"
                                }`}
                              >
                                {availableSeats} seats left
                              </span>
                            )}
                          </div>
                          <progress
                            className={`progress w-full ${
                              availableSeats === 0
                                ? "progress-error"
                                : status === "complete"
                                ? ""
                                : "progress-primary"
                            }`}
                            value={soldTickets}
                            max={totalSeats}
                          ></progress>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-3xl shadow">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold">No screenings match filters</h2>
            <p className="text-base-content/60 mt-2">Try adjusting your date, movie, or hall selection.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffDashboard;
