import { useEffect, useState, } from "react";
import { useParams } from "react-router";
import { dbApi } from "../../api/db";
import type { Movie, Screening } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import MovieShowcase from "../ui/MovieShowcase";
import ScreeningSelect from "../ui/ScreeningSelect";
import BackButton from "../ui/BackButton";
import toast from "react-hot-toast";

const MoviePage = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);

  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch {
        const err = "Failed to fetch movie details";
        setError(err);
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

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
        <BackButton text="Back to Home"/>
        <MovieShowcase movie={movie}/>
        <ScreeningSelect screenings={screenings}/>
      </div>
    </Layout>
  );
};

export default MoviePage;
