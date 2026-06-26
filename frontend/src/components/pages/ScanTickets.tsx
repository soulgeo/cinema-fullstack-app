import { useState } from "react";
import Layout from "../layout/Layout";
import QrScanner from "../ui/QRScanner";
import { dbApi } from "../../api/db";
import type { RichTicket } from "../../api/types";
import toast from "react-hot-toast";
import Card from "../ui/Card";
import BackButton from "../ui/BackButton";

export default function ScanTickets() {
  const [lastValidatedTicket, setLastValidatedTicket] = useState<RichTicket | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    if (isValidating) return;

    try {
      const data = JSON.parse(decodedText);
      if (!data.id || !data.secret) {
        toast.error("Invalid QR code format");
        return;
      }

      setIsValidating(true);
      const response = await dbApi.tickets.validate(data.id, data.secret);
      
      setLastValidatedTicket(response.ticket);
      toast.success("Ticket validated successfully!");
    } catch (error: unknown) {
      console.error("Validation error:", error);
      if (error instanceof Error) {
        toast.error(`Validation failed: ${error.message}`);
      } else {
        toast.error("Failed to validate ticket");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleScanFailure = () => {
    // We don't want to spam toasts for every frame that doesn't find a QR code
    // console.log("Scan failure:", error);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-base-content">Scan Tickets</h1>
            <p className="text-base-content/70">Scan ticket QR codes to validate entry</p>
          </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-3xl border-4 border-primary/20 bg-base-200 shadow-xl">
          <QrScanner 
            onScanSuccess={handleScanSuccess} 
            onScanFailure={handleScanFailure} 
          />
        </div>

        {isValidating && (
          <div className="flex justify-center mb-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {lastValidatedTicket && !isValidating && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="badge badge-success font-bold mb-2">VALIDATED</span>
                    <h2 className="text-2xl font-bold">{lastValidatedTicket.screening.movie.title}</h2>
                    <p className="text-base-content/70">
                      {new Date(lastValidatedTicket.screening.start_time).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium opacity-70">Seat</p>
                    <p className="text-2xl font-black text-primary">
                      {lastValidatedTicket.seat.row_label}{lastValidatedTicket.seat.seat_number}
                    </p>
                  </div>
                </div>
                
                <div className="divider my-0"></div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-70">Hall</p>
                    <p className="font-bold">{lastValidatedTicket.screening.hall.name}</p>
                  </div>
                  <div>
                    <p className="opacity-70">Ticket ID</p>
                    <p className="font-bold">#{lastValidatedTicket.id}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {!lastValidatedTicket && !isValidating && (
          <div className="text-center py-12 opacity-50">
            <div className="text-6xl mb-4">📷</div>
            <p>Position the QR code within the frame to scan</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
