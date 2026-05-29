import Layout from "../layout/Layout";
import "animate.css";
import { useEffect, useState } from "react";
import { dbApi } from "../../api/db";
import type { Movie } from "../../api/types";
import MovieCard from "../ui/MovieCard";
import Loading from "../ui/Loading";

const HomePage = () => {
  const [movies, setMovies] = useState<Array<Movie> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchMovies = async () => {
      try {
        const movies = await dbApi.movies.list();
        if (active) {
          setMovies(movies);
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
          <h1 className="text-5xl font-extrabold mb-4 bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            Now Showing
          </h1>
          <p className="text-lg opacity-70">
            Discover the latest blockbusters and critically acclaimed films.
          </p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 animate__animated animate__fadeInUp">
          {movies?.filter(m => m.is_active).map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </section>

        {movies?.filter(m => m.is_active).length === 0 && (
          <div className="text-center py-20 opacity-50">
            <p className="text-2xl">No movies currently airing.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HomePage;
