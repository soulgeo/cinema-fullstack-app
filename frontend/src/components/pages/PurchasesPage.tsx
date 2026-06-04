import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { dbApi } from "../../api/db";
import type { Purchase } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import { toast } from "react-hot-toast";
import BackButton from "../ui/BackButton";
import Card from "../ui/Card";
import { CreditCard, Calendar, Clock, Ticket } from "lucide-react";

const PurchasesPage = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const navigate = useNavigate();

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await dbApi.purchases.list();
      // Sort by newest first
      setPurchases(data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      toast.error("Failed to load purchases.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handlePay = (purchaseId: number) => {
    navigate(`/payment/${purchaseId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="badge badge-success font-bold">Paid</span>;
      case "PENDING":
        return <span className="badge badge-warning font-bold">Pending</span>;
      case "CANCELLED":
        return <span className="badge badge-error font-bold">Cancelled</span>;
      default:
        return <span className="badge badge-ghost font-bold">{status}</span>;
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="w-full flex flex-col gap-8 py-8 max-w-5xl mx-auto">
        <div className="flex flex-col gap-2">
          <BackButton />
          <h1 className="text-3xl font-bold">My Purchases</h1>
          <p className="text-base-content/70">Track your booking history and complete pending payments</p>
        </div>

        {purchases.length === 0 ? (
          <div className="bg-base-100 p-12 rounded-3xl shadow-lg text-center flex flex-col items-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">No purchases yet</h2>
            <p className="opacity-70 mb-8 max-w-md text-balance">
              Once you start booking tickets, they will appear here for you to manage.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {purchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Left Column: Summary */}
                  <div className="p-6 md:w-1/3 bg-base-200/50 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase font-black opacity-40 tracking-widest">Purchase ID</span>
                        <span className="font-mono font-bold">#{purchase.id.toString().padStart(6, '0')}</span>
                      </div>
                      {getStatusBadge(purchase.status)}
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Calendar size={14} />
                        {new Date(purchase.created_at).toLocaleDateString([], { 
                          year: 'numeric', month: 'long', day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-70">
                        <Clock size={14} />
                        {new Date(purchase.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-base-content/10">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold opacity-60">Total</span>
                        <span className="text-2xl font-black text-primary">€{parseFloat(purchase.total_price).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Tickets & Actions */}
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <h3 className="text-sm font-black uppercase tracking-widest opacity-40 flex items-center gap-2">
                      <Ticket size={16} /> Tickets ({purchase.tickets.length})
                    </h3>
                    
                    <div className="flex flex-col gap-2">
                      {/* Note: Tickets in the list might not have screening info unless the API returns it.
                          In our PurchaseSerializer, we use TicketDetailSerializer which doesn't have screening title.
                          Let's assume for now we just show the ticket ID and price, 
                          or we'd need to improve the backend serializer. */}
                      {purchase.tickets.map((ticket) => (
                        <div key={ticket.id} className="flex justify-between items-center text-sm p-3 bg-base-100 rounded-xl border border-base-content/5">
                          <span className="font-medium">Ticket #{ticket.id}</span>
                          <span className="font-bold opacity-60">€{parseFloat(ticket.price_paid || "0").toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {purchase.status === "PENDING" && (
                      <div className="mt-4">
                        <button 
                          onClick={() => handlePay(purchase.id)}
                          className="btn btn-primary w-full gap-2"
                        >
                          <CreditCard size={18} />
                          Pay Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PurchasesPage;
