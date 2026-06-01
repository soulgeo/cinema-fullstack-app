import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { Screening } from "../../api/types";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface ScreeningSelectProps {
  screenings: Screening[]
}

const ScreeningSelect = ({ screenings }: ScreeningSelectProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const {userLoggedIn, setShowLogin} = useAuth();
  const navigate = useNavigate();
  
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
    
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleBookClick = (screening: Screening) => {
    if (!userLoggedIn) {
      setShowLogin(true);
      return;
    }
    navigate("/booking", { state: screening });
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 95;
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + (direction === "left" ? -scrollAmount : scrollAmount),
        behavior: "smooth",
      });
    }
  };

  return (
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
                  Hall: {screening.hall.name}
                </span>
              </div>
              <div className="flex flex-row gap-4 items-center justify-end">
                <span className="text-lg font-semibold">
                  €{screening.base_price}
                </span>
                <button onClick={() => handleBookClick(screening)} className="btn btn-primary">Book Now</button>
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
  )
}

export default ScreeningSelect;
