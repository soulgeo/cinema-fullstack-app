import { useState } from "react";
import type { Screening } from "../../api/types";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import DateSelector from "./DateSelector";

interface ScreeningSelectProps {
  screenings: Screening[]
}

const ScreeningSelect = ({ screenings }: ScreeningSelectProps) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const {userLoggedIn, setShowLogin} = useAuth();
  const navigate = useNavigate();

  const filteredScreenings = screenings
    .filter((s) => {
      const screeningDate = new Date(s.start_time).toISOString().split("T")[0];
      return screeningDate === selectedDate;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const datesWithScreenings = new Set(
    screenings.map((s) => new Date(s.start_time).toISOString().split("T")[0])
  );

  const handleBookClick = (screening: Screening) => {
    if (!userLoggedIn) {
      setShowLogin(true);
      return;
    }
    navigate("/booking", { state: screening });
  }

  return (
    <section className="bg-base-100 p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6">Available Screenings</h2>

      <DateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        datesWithScreenings={datesWithScreenings}
      />

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
