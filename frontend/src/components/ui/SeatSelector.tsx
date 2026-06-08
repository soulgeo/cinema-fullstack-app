import { Armchair } from "lucide-react";
import type { Seat } from "../../api/types";

interface SeatSelectorProps {
  seats: Seat[];
  occupiedSeatIds: Set<number>;
  selectedSeats: Seat[];
  onSeatClick: (seat: Seat) => void;
}

const SeatSelector = ({ seats, occupiedSeatIds, selectedSeats, onSeatClick }: SeatSelectorProps) => {
  // Group seats by row for rendering
  const rows: Record<string, Seat[]> = {};
  seats.forEach((seat) => {
    if (!rows[seat.row_label]) rows[seat.row_label] = [];
    rows[seat.row_label].push(seat);
  });
  
  // Sort seats within rows by number
  Object.values(rows).forEach(rowSeats => rowSeats.sort((a, b) => a.seat_number - b.seat_number));
  
  // Sort rows alphabetically
  const sortedRowLabels = Object.keys(rows).sort();

  return (
    <div className="w-full overflow-x-auto pb-2 touch-pan-x">
      <div className="inline-flex flex-col items-center min-w-full py-4 px-0">
        {/* Screen visualization */}
        <div className="flex flex-col items-center mb-8 w-full max-w-4xl">
          <div className="w-full h-1.5 bg-base-300 rounded-full shadow-inner mb-4"></div>
          <span className="text-sm font-black uppercase tracking-[0.6em] text-primary">SCREEN</span>
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-1 sm:gap-2 mb-2">
          {sortedRowLabels.map((rowLabel, rowIndex) => (
            <div key={rowLabel} className="flex flex-col gap-1 sm:gap-2">
              {/* Horizontal Aisle/Stair every 4 rows */}
              {rowIndex > 0 && rowIndex % 4 === 0 && <div className="h-1 sm:h-1.5" />}
              
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="w-4 sm:w-6 text-[10px] sm:text-xs font-bold opacity-60 text-right shrink-0">{rowLabel}</span>
                <div className="flex gap-0.5 sm:gap-1">
                  {rows[rowLabel].map((seat, seatIndex) => {
                    const isOccupied = occupiedSeatIds.has(seat.id);
                    const isSelected = selectedSeats.find(s => s.id === seat.id);
                    const isVIP = seat.seat_type === "VIP";
                    
                    // Dynamic aisle positioning - add gap every ~6-8 seats
                    const needsVerticalAisle = seatIndex > 0 && (
                      (rows[rowLabel].length > 12 && (seatIndex === 4 || seatIndex === rows[rowLabel].length - 4)) ||
                      (rows[rowLabel].length <= 12 && seatIndex === Math.floor(rows[rowLabel].length / 2))
                    );

                    return (
                      <div key={seat.id} className="flex items-center gap-0.5 sm:gap-1">
                        {needsVerticalAisle && <div className="w-1 sm:w-1.5" />}
                        <button
                          disabled={isOccupied}
                          onClick={() => onSeatClick(seat)}
                          className={`
                            w-5 h-5 sm:w-7 sm:h-7 rounded-sm sm:rounded-md flex items-center justify-center transition-all relative group
                            ${isOccupied ? "bg-base-300 cursor-not-allowed opacity-30" : 
                              isSelected ? "bg-primary text-primary-content scale-110 shadow-lg" : 
                              isVIP ? "bg-warning/10 border border-warning/30 hover:bg-warning/20 text-warning/70" : "bg-base-200 hover:bg-base-300 text-base-content/40 hover:text-base-content"}
                          `}
                          title={`${rowLabel}${seat.seat_number} - ${seat.seat_type}`}
                        >
                          <Armchair className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          {isVIP && !isSelected && !isOccupied && (
                            <div className="absolute -top-0.5 -right-0.5 w-1 h-1 sm:w-2 sm:h-2 bg-warning rounded-full shadow-sm"></div>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
                <span className="w-4 sm:w-6 text-[10px] sm:text-xs font-bold opacity-60 text-left shrink-0">{rowLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 text-sm mt-8">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-base-200"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-base-300 opacity-40"></div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-warning/40 bg-warning/20"></div>
          <span>VIP (+50%)</span>
        </div>
      </div>
    </div>
  );
};

export default SeatSelector;
