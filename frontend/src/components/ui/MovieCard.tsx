import { Clock, Star } from "lucide-react";
import { Link } from "react-router";
import type { Movie } from "../../api/types";

interface Props {
  movie: Movie;
}

const MovieCard = ({ movie }: Props) => {
  // Helper to format duration if it's a string like "02:46:00"
  const formatDuration = (duration: string) => {
    const parts = duration.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  return (
    <Link 
      to={`/movies/${movie.id}`}
      className="card card-compact bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 group overflow-hidden border border-base-300 cursor-pointer"
    >
      <figure className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.poster_url || "https://via.placeholder.com/500x750?text=No+Poster"}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2 badge badge-secondary font-bold gap-1 shadow-md">
          <Star size={12} fill="currentColor" />
          {movie.rating}
        </div>
      </figure>
      <div className="card-body gap-1">
        <h2 className="card-title text-lg leading-tight line-clamp-2 min-h-[3rem] group-hover:text-primary transition-colors">
          {movie.title}
        </h2>
        <p className="text-xs font-medium uppercase tracking-wider text-base-content/50 line-clamp-1">
          {movie.genres || "No genres"}
        </p>
        <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-300">
          <div className="flex items-center gap-1.5 text-sm font-semibold opacity-70">
            <Clock size={14} className="text-primary" />
            {formatDuration(movie.duration)}
          </div>
          <div className="btn btn-primary btn-sm btn-outline">Details</div>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
