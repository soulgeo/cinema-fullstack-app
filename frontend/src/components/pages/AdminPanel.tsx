import { LineChart, PieChart } from "@mui/x-charts"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import Layout from "../layout/Layout"
import { useEffect, useState } from "react"
import type { Purchase, Movie, Screening } from "../../api/types";
import { dbApi } from "../../api/db";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import { Calendar, Film, DollarSign, Ticket } from "lucide-react";

// Create custom Material UI theme that maps perfectly to DaisyUI's dynamic colors
const chartDarkTheme = createTheme({
  palette: {
    mode: "dark",
    text: {
      primary: "var(--color-base-content)", // DaisyUI Base Content (Text)
      secondary: "var(--color-base-content)", // Muted Text
    },
    background: {
      default: "var(--color-base-100)", // Base 100
      paper: "var(--color-base-200)", // Base 200 (for tooltips, popovers)
    },
  },
});

// A cohesive color palette derived directly from DaisyUI theme tokens
const daisyUiColors = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-accent)",
  "var(--color-neutral)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-error)",
  "var(--color-info)",
];

// Formats a Date object as local YYYY-MM-DD
const formatDate = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// Timezone-safe date parser
const parseDateStr = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// Generates YYYY-MM-DD date list in range
const getDatesInRange = (startStr: string, endStr: string) => {
  const dates: string[] = [];
  const start = parseDateStr(startStr);
  const end = parseDateStr(endStr);
  const current = new Date(start);
  let count = 0;
  while (current <= end && count < 100) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
    count++;
  }
  return dates;
};

// Formats YYYY-MM-DD date as "MMM DD" for charts
const formatAxisDate = (dateStr: string) => {
  try {
    const [_, month, day] = dateStr.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIndex = parseInt(month) - 1;
    return `${monthNames[mIndex]} ${parseInt(day)}`;
  } catch {
    return dateStr;
  }
};

const AdminPanel = () => {
  // Past week defaults (6 days ago to today)
  const today = new Date();
  const startOfPastWeek = new Date();
  startOfPastWeek.setDate(today.getDate() - 6);

  const [fromDate, setFromDate] = useState(formatDate(startOfPastWeek));
  const [tillDate, setTillDate] = useState(formatDate(today));
  
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  
  const [loadingStatic, setLoadingStatic] = useState(true);
  const [loadingPurchases, setLoadingPurchases] = useState(true);

  // Fetch static data (movies, screenings) once on mount
  useEffect(() => {
    const fetchStatic = async () => {
      try {
        const [moviesData, screeningsData] = await Promise.all([
          dbApi.movies.list(),
          dbApi.screenings.list(),
        ]);
        setMovies(moviesData);
        setScreenings(screeningsData);
      } catch {
        toast.error("Failed to fetch movie or screening data");
      } finally {
        setLoadingStatic(false);
      }
    };
    fetchStatic();
  }, []);

  // Fetch dynamic data (purchases) whenever date range changes
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoadingPurchases(true);
        const purchasesData = await dbApi.purchases.list({
          from_date: fromDate,
          till_date: tillDate,
        });
        setPurchases(purchasesData);
      } catch {
        toast.error("Failed to fetch sales data for the selected range");
      } finally {
        setLoadingPurchases(false);
      }
    };
    fetchPurchases();
  }, [fromDate, tillDate]);

  // Construct mappings and compute statistics
  const screeningMap = new Map<number, Screening>();
  screenings.forEach(s => screeningMap.set(s.id, s));

  // Filter screenings in the selected period
  const screeningsInPeriod = screenings.filter(s => {
    const dateStr = s.start_time.split("T")[0];
    return dateStr >= fromDate && dateStr <= tillDate;
  });

  // Paid purchases in the range
  const paidPurchases = purchases.filter(p => p.status === "PAID");

  // Map of stats per movie
  const movieStatsMap = new Map<number, { screeningsCount: number; ticketsCount: number; revenue: number }>();
  movies.forEach(movie => {
    movieStatsMap.set(movie.id, {
      screeningsCount: 0,
      ticketsCount: 0,
      revenue: 0,
    });
  });

  // Accumulate screenings per movie
  screeningsInPeriod.forEach(s => {
    const movieId = s.movie.id;
    const stats = movieStatsMap.get(movieId);
    if (stats) {
      stats.screeningsCount += 1;
    }
  });

  // Accumulate daily revenue and movie-specific sales
  const datesList = getDatesInRange(fromDate, tillDate);
  const revenueByDayMap = new Map<string, number>();
  datesList.forEach(d => revenueByDayMap.set(d, 0));

  paidPurchases.forEach(p => {
    const paidDate = p.paid_at ? p.paid_at.split("T")[0] : p.created_at.split("T")[0];
    const purchasePrice = parseFloat(p.total_price || "0");

    if (revenueByDayMap.has(paidDate)) {
      revenueByDayMap.set(paidDate, (revenueByDayMap.get(paidDate) || 0) + purchasePrice);
    }

    p.tickets.forEach(ticket => {
      const screening = screeningMap.get(ticket.screening);
      if (screening) {
        const movieId = screening.movie.id;
        const stats = movieStatsMap.get(movieId);
        if (stats) {
          stats.ticketsCount += 1;
          stats.revenue += parseFloat(ticket.price_paid || "0");
        }
      }
    });
  });

  // Calculate totals for KPI stats
  const totalRevenue = paidPurchases.reduce((acc, p) => acc + parseFloat(p.total_price || "0"), 0);
  const totalTickets = paidPurchases.reduce((acc, p) => acc + p.tickets.length, 0);
  const totalScreenings = screeningsInPeriod.length;

  // Prepare line chart data
  const lineChartDates = datesList.map(formatAxisDate);
  const lineChartRevenue = datesList.map(d => revenueByDayMap.get(d) || 0);

  // Sort movies by tickets sold descending
  const sortedMovieData = movies
    .map((movie) => {
      const stats = movieStatsMap.get(movie.id) || { ticketsCount: 0 };
      return {
        value: stats.ticketsCount,
        label: movie.title,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Group least popular movies into "Other" (keeping top 9 individual + 1 "Other")
  const maxSlices = 10;
  let pieChartData: { id: number; value: number; label: string }[] = [];

  if (sortedMovieData.length <= maxSlices) {
    pieChartData = sortedMovieData.map((item, index) => ({
      id: index,
      value: item.value,
      label: item.label,
    }));
  } else {
    const topMovies = sortedMovieData.slice(0, maxSlices - 1);
    const otherMovies = sortedMovieData.slice(maxSlices - 1);
    const otherSum = otherMovies.reduce((acc, item) => acc + item.value, 0);

    pieChartData = topMovies.map((item, index) => ({
      id: index,
      value: item.value,
      label: item.label,
    }));

    if (otherSum > 0) {
      pieChartData.push({
        id: maxSlices - 1,
        value: otherSum,
        label: "Other",
      });
    }
  }

  const isLoading = loadingStatic || loadingPurchases;

  return (
    <Layout fullWidth={true}>
      <div className="w-full p-8 pt-2 flex flex-col gap-4 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-end flex-wrap gap-4 border-b border-base-content/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content tracking-tight">Admin Panel</h1>
            <p className="text-base-content/70 font-medium">Weekly Cinema Sales Report & Analytics</p>
          </div>
          
          {/* Date Selector widget */}
          <div className="flex flex-nowrap items-center gap-2 bg-base-200 p-2 rounded-2xl border border-base-content/5">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Calendar size={16} className="text-primary ml-1" />
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/60">Range:</span>
            </div>
            <input 
              type="date" 
              className="input input-sm input-bordered bg-base-100 font-semibold flex-shrink-0 w-36"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="text-base-content/40 text-xs font-bold flex-shrink-0">to</span>
            <input 
              type="date" 
              className="input input-sm input-bordered bg-base-100 font-semibold flex-shrink-0 w-36"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
            />
          </div>
        </header>

        {isLoading ? (
          <div className="py-20">
            <Loading size="lg" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-6">
              <Card className="p-6 flex items-center gap-4 bg-linear-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="p-4 bg-primary text-primary-content rounded-2xl">
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-base-content/60 uppercase tracking-wider">Total Revenue</div>
                  <div className="text-2xl font-black text-primary">
                    ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </Card>

              <Card className="p-6 flex items-center gap-4 bg-linear-to-br from-secondary/10 to-transparent border border-secondary/20">
                <div className="p-4 bg-secondary text-secondary-content rounded-2xl">
                  <Ticket size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-base-content/60 uppercase tracking-wider">Tickets Sold</div>
                  <div className="text-2xl font-black text-base-content/80">
                    {totalTickets.toLocaleString()}
                  </div>
                </div>
              </Card>

              <Card className="p-6 flex items-center gap-4 bg-linear-to-br from-accent/10 to-transparent border border-accent/20">
                <div className="p-4 bg-accent text-accent-content rounded-2xl">
                  <Film size={24} />
                </div>
                <div>
                  <div className="text-sm font-bold text-base-content/60 uppercase tracking-wider">Screenings</div>
                  <div className="text-2xl font-black text-base-content/80">
                    {totalScreenings.toLocaleString()}
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Container */}
            <ThemeProvider theme={chartDarkTheme}>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-2">
                {/* Daily Revenue Line Chart */}
                <Card className="p-6 flex flex-col gap-4">
                  <h3 className="text-lg font-black text-base-content tracking-tight">Revenue Trend per Day</h3>
                  <div className="w-full flex justify-center">
                    {lineChartRevenue.every(v => v === 0) ? (
                      <div className="flex items-center justify-center h-75 text-base-content/50 font-medium">
                        No sales revenue in selected period
                      </div>
                    ) : (
                      <LineChart
                        xAxis={[{ 
                          data: lineChartDates, 
                          scaleType: 'point' 
                        }]}
                        series={[{
                          data: lineChartRevenue,
                          label: 'Revenue ($)',
                          color: 'var(--color-primary)', // Primary theme color
                          showMark: true,
                          curve: 'linear',
                        }]}
                        colors={daisyUiColors}
                        height={400}
                        grid={{ vertical: true, horizontal: true }}
                      />
                    )}
                  </div>
                </Card>

                {/* Tickets per Movie Pie Chart */}
                <Card className="p-6 flex flex-col gap-4">
                  <h3 className="text-lg font-black text-base-content tracking-tight">Tickets Sold per Movie</h3>
                  <div className="w-full h-full flex items-center justify-center">
                    {pieChartData.length === 0 ? (
                      <div className="flex items-center justify-center h-[300px] text-base-content/50 font-medium">
                        No tickets sold in selected period
                      </div>
                    ) : (
                      <PieChart
                        series={[{
                          data: pieChartData,
                          innerRadius: 20,
                          outerRadius: 120,
                          paddingAngle: 4,
                          cornerRadius: 3,
                          cx: 160,
                          cy: 160,
                        }]}
                        colors={daisyUiColors}
                        height={300}
                      />
                    )}
                  </div>
                </Card>
              </div>
            </ThemeProvider>

            {/* Movie Sales Table */}
            <Card className="p-6 flex flex-col gap-4 mt-4">
              <div>
                <h3 className="text-lg font-black text-base-content tracking-tight">Movie Performance Summary</h3>
                <p className="text-sm text-base-content/60">Breakdown of screenings, tickets, and revenue per movie</p>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr className="text-base-content/60 border-b border-base-content/10">
                      <th className="font-extrabold text-sm uppercase tracking-wider text-left">Movie Title</th>
                      <th className="text-right font-extrabold text-sm uppercase tracking-wider">Screenings</th>
                      <th className="text-right font-extrabold text-sm uppercase tracking-wider">Tickets Sold</th>
                      <th className="text-right font-extrabold text-sm uppercase tracking-wider">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-base-content/50 font-semibold">No movies registered</td>
                      </tr>
                    ) : (
                      movies.map((movie) => {
                        const stats = movieStatsMap.get(movie.id) || { screeningsCount: 0, ticketsCount: 0, revenue: 0 };
                        return (
                          <tr key={movie.id} className="hover border-b border-base-content/5">
                            <td className="font-bold text-base-content text-base">{movie.title}</td>
                            <td className="text-right font-bold text-base-content/80">{stats.screeningsCount}</td>
                            <td className="text-right font-bold text-base-content/80">{stats.ticketsCount}</td>
                            <td className="text-right font-black text-primary text-base">
                              ${stats.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
