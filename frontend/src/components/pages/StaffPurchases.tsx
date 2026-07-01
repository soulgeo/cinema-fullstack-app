import { useEffect, useState, useRef } from "react";
import Layout from "../layout/Layout";
import { dbApi } from "../../api/db";
import type { Purchase } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import { Search, X, ShoppingBag } from "lucide-react";
import BackButton from "../ui/BackButton";

const StaffPurchases = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Cancellation confirmation dialog states
  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const data = await dbApi.purchases.list();
      // Sort by newest first
      setPurchases(data.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPurchases();
  }, []);

  const openCancelDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    cancelDialogRef.current?.showModal();
  };

  const closeCancelDialog = () => {
    cancelDialogRef.current?.close();
    setSelectedPurchase(null);
  };

  const handleCancelPurchase = async () => {
    if (!selectedPurchase) return;
    try {
      await dbApi.purchases.update(selectedPurchase.id, { status: "CANCELLED" });
      toast.success("Purchase cancelled successfully");
      closeCancelDialog();
      await fetchPurchases();
    } catch {
      toast.error("Failed to cancel purchase");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <span className="badge badge-success font-bold text-xs uppercase">Paid</span>;
      case "PENDING":
        return <span className="badge badge-warning font-bold text-xs uppercase">Pending</span>;
      case "CANCELLED":
        return <span className="badge badge-error font-bold text-xs uppercase">Cancelled</span>;
      default:
        return <span className="badge badge-ghost font-bold text-xs uppercase">{status}</span>;
    }
  };

  // Format date nicely
  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filtered purchases
  const filteredPurchases = purchases.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesId = p.id.toString().includes(query) || p.id.toString().padStart(6, '0').includes(query);
    const matchesEmail = p.client_email?.toLowerCase().includes(query) || false;
    const matchesName = p.client_name?.toLowerCase().includes(query) || false;

    return matchesStatus && (matchesId || matchesEmail || matchesName);
  });

  return (
    <Layout fullWidth={true}>
      <div className="w-full p-8 pt-2 flex flex-col gap-4 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-end flex-wrap gap-4 border-b border-base-content/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content tracking-tight">Search Purchases</h1>
            <p className="text-base-content/70 font-medium">Search customer bookings and manage cancellations</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-row flex-wrap gap-4 items-center justify-between bg-base-200 p-4 rounded-2xl border border-base-content/5">
          <div className="flex flex-row flex-wrap gap-4 items-center w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none opacity-50">
                <Search size={18} />
              </span>
              <input
                type="text"
                placeholder="Search by ID, Customer Name or Email..."
                className="input input-sm input-bordered pl-10 w-full font-semibold focus:outline-none focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 opacity-50 hover:opacity-100"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="form-control">
              <select
                className="select select-sm select-bordered w-48 font-semibold bg-base-100"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="PAID">Paid</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="text-sm font-bold text-base-content/60">
            Total Matches: {filteredPurchases.length}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20">
            <Loading size="lg" />
          </div>
        ) : filteredPurchases.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-base-200 text-base-content/40">
              <ShoppingBag size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No purchases found</h3>
              <p className="text-base-content/60 text-sm mt-1">
                {searchQuery || statusFilter !== "all"
                  ? "Try resetting your search query or filters."
                  : "No purchases have been made yet."}
              </p>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full bg-base-100 rounded-2xl shadow border border-base-content/5">
              <thead>
                <tr className="text-base-content/60 border-b border-base-content/10 bg-base-200">
                  <th className="font-extrabold text-xs uppercase tracking-wider text-left pl-6">Purchase ID</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-left">Customer</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-left">Date</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-center">Tickets</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-right">Total Price</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="font-extrabold text-xs uppercase tracking-wider text-center pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover border-b border-base-content/5">
                    <td className="pl-6 py-4 font-mono font-bold text-sm">
                      #{p.id.toString().padStart(6, '0')}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-base-content">{p.client_name || "N/A"}</span>
                        <span className="text-xs text-base-content/50 font-medium">{p.client_email || "N/A"}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sm font-medium">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="py-4 text-center font-bold text-sm">
                      {p.tickets.length}
                    </td>
                    <td className="py-4 text-right font-black text-primary text-sm">
                      €{parseFloat(p.total_price).toFixed(2)}
                    </td>
                    <td className="py-4 text-center">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-4 text-center pr-6">
                      {p.status !== "CANCELLED" ? (
                        <button
                          onClick={() => openCancelDialog(p)}
                          className="btn btn-xs btn-outline btn-error font-bold"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-xs text-base-content/40 italic">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <dialog
        ref={cancelDialogRef}
        onClose={closeCancelDialog}
        className="m-auto bg-transparent border-none w-sm p-3 overflow-visible"
      >
        <div className="animate-subtle-zoom-fade">
          <button
            onClick={closeCancelDialog}
            className="btn btn-ghost btn-circle absolute top-3 right-3 z-50"
          >
            ✕
          </button>
          <Card>
            <div className="w-full p-2 text-center font-bold text-lg text-error">
              Cancel Purchase?
            </div>
            {selectedPurchase && (
              <div className="flex flex-col gap-3 my-4 text-left">
                <div className="text-sm border-b border-base-content/10 pb-2">
                  <span className="font-semibold opacity-70 text-xs uppercase tracking-wider block mb-0.5">Purchase</span>{" "}
                  <span className="font-mono font-bold">#{selectedPurchase.id.toString().padStart(6, '0')}</span>
                </div>
                <div className="text-sm border-b border-base-content/10 pb-2">
                  <span className="font-semibold opacity-70 text-xs uppercase tracking-wider block mb-0.5">Customer</span>{" "}
                  <span className="font-bold">{selectedPurchase.client_name || "N/A"}</span>
                  <div className="text-xs opacity-50">{selectedPurchase.client_email || "N/A"}</div>
                </div>
                <div className="text-sm border-b border-base-content/10 pb-2 flex justify-between">
                  <span>
                    <span className="font-semibold opacity-70 text-xs uppercase tracking-wider block mb-0.5">Tickets</span>{" "}
                    <span className="font-bold">{selectedPurchase.tickets.length}</span>
                  </span>
                  <span className="text-right">
                    <span className="font-semibold opacity-70 text-xs uppercase tracking-wider block mb-0.5">Total</span>{" "}
                    <span className="font-bold text-primary">€{parseFloat(selectedPurchase.total_price).toFixed(2)}</span>
                  </span>
                </div>
                <p className="text-xs text-error font-medium leading-relaxed mt-1">
                  ⚠️ Warning: This will delete all {selectedPurchase.tickets.length} tickets associated with this purchase, releasing the seats back to the hall.
                </p>
              </div>
            )}
            <div className="flex gap-2 w-full mt-2">
              <button
                className="btn btn-error flex-1 font-bold"
                onClick={handleCancelPurchase}
              >
                Confirm Cancel
              </button>
              <button
                className="btn btn-ghost flex-1 font-bold"
                onClick={closeCancelDialog}
              >
                Keep Booking
              </button>
            </div>
          </Card>
        </div>
      </dialog>
    </Layout>
  );
};

export default StaffPurchases;
