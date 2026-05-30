import type { Movie } from "../../api/types";

interface MovieShowcaseProps {
  movie: Movie;
}

const MovieShowcase = ({ movie }: MovieShowcaseProps) => {
  return (
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
  )
}

export default MovieShowcase;
