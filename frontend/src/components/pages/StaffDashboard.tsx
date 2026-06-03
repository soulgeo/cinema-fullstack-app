import { useEffect, useState } from "react";
import { dbApi } from "../../api/db";
import type { Screening } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import Layout from "../layout/Layout";

const StaffDashboard = () => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await dbApi.screenings.showingToday();
        setScreenings(data);
      } catch {
        const err = "Failed to fetch screening details";
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          <p className="text-base-content/70">Today's Screenings Overview</p>
        </header>

        {screenings.length > 0 ? (
          <div className="flex flex-col gap-4 mx-auto">
            {[...screenings]
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .map((screening) => {
                const rows = screening.hall.rows_count;
                const cols = screening.hall.cols_count;
                const totalSeats = rows * cols;
                const soldTickets = screening.tickets_count || 0;
                const availableSeats = totalSeats - soldTickets;
                
                const startTime = new Date(screening.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <Card key={screening.id}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex flex-row items-center gap-6">
                      <span className="text-2xl font-bold min-w-30"> {startTime} </span>
                        <div className="flex flex-col gap-2 mt-1">
                          <h3 className="text-xl font-bold">{screening.movie_title}</h3>
                          <span className="text-sm opacity-70">in {screening.hall.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-col md:items-end gap-1 flex-1 md:max-w-xs">
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-medium opacity-70">Occupancy ({soldTickets}/{totalSeats})</span>
                          <span className={`text-sm font-bold ${availableSeats === 0 ? 'text-error' : 'text-success'}`}>
                            {availableSeats} seats left
                          </span>
                        </div>
                        <progress 
                          className={`progress w-full ${availableSeats === 0 ? 'progress-error' : 'progress-primary'}`} 
                          value={soldTickets} 
                          max={totalSeats}
                        ></progress>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-base-100 rounded-3xl shadow">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold">No screenings today</h2>
            <p className="text-base-content/60 mt-2">Check back later or schedule new screenings.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default StaffDashboard;
