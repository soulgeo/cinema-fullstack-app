import Layout from "../layout/Layout";
import "animate.css";
import { useEffect, useState } from "react";
import { dbApi } from "../../api/db";
import type { Movie } from "../../api/types";
import MovieCard from "../ui/MovieCard";
import Loading from "../ui/Loading";

const HomePage = () => {
  const Tab = {
    SHOWING: "SHOWING",
    UPCOMING: "UPCOMING",
  };

  const [showingMovies, setShowingMovies] = useState<Array<Movie> | null>(null);
  const [upcomingMovies, setUpcomingMovies] = useState<Array<Movie> | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(Tab.SHOWING);

  useEffect(() => {
    let active = true;

    const fetchMovies = async () => {
      try {
        const movies = await dbApi.movies.list();
        if (active) {
          const today = new Date();
          const shMovies = movies.filter((movie) => {
            const dateStr = movie.release_date;
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.getTime() < today.getTime();
          })
          const upMovies = movies.filter((movie) => {
            const dateStr = movie.release_date;
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.getTime() > today.getTime();
          })
          setShowingMovies(shMovies);
          setUpcomingMovies(upMovies);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchMovies();

    return () => {
      active = false;
    };
  }, [])

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout fullWidth>
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center animate__animated animate__fadeIn">
          <h1 className="text-5xl font-extrabold mb-4 pb-1 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            {tab === Tab.SHOWING ? "Now Showing" : "Coming Soon"}
          </h1>
          <p className="text-lg opacity-70">
            {tab === Tab.SHOWING 
              ? "Discover the latest blockbusters and critically acclaimed films."
              : "Be the first to see the most anticipated upcoming releases."}
          </p>
        </header>

        <div className="flex justify-center mb-12">
          <div className="tabs tabs-boxed rounded-md bg-base-200 p-1">
            <button 
              className={`tab tab-lg transition-all rounded-md ${tab === Tab.SHOWING ? 'tab-active bg-primary! text-primary-content!' : ''}`}
              onClick={() => setTab(Tab.SHOWING)}
            >
              Now Showing
            </button>
            <button 
              className={`tab tab-lg transition-all rounded-md ${tab === Tab.UPCOMING ? 'tab-active bg-secondary! text-secondary-content!' : ''}`}
              onClick={() => setTab(Tab.UPCOMING)}
            >
              Coming Soon
            </button>
          </div>
        </div>

        <section key={tab} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 animate__animated animate__fadeInUp">
          {(tab === Tab.SHOWING ? showingMovies : upcomingMovies)?.filter(m => m.is_active).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </section>

        {(tab === Tab.SHOWING ? showingMovies : upcomingMovies)?.filter(m => m.is_active).length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p className="text-2xl">No movies currently airing.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;
