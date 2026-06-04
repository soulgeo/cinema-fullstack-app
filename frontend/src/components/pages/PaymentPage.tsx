import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { dbApi } from "../../api/db";
import type { Purchase } from "../../api/types";
import Layout from "../layout/Layout";
import Loading from "../ui/Loading";
import { toast } from "react-hot-toast";
import BackButton from "../ui/BackButton";
import Card from "../ui/Card";
import Input from "../ui/Input";
import { CreditCard, Lock, ShieldCheck, Ticket as TicketIcon } from "lucide-react";

const PaymentPage = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    const fetchPurchase = async () => {
      if (!purchaseId) return;
      try {
        const data = await dbApi.purchases.get(parseInt(purchaseId));
        if (data.status === "PAID") {
          toast.success("This purchase is already paid.");
          navigate("/tickets");
          return;
        }
        setPurchase(data);
      } catch (err) {
        toast.error("Failed to load purchase details.");
        console.error(err);
        navigate("/purchases");
      } finally {
        setLoading(false);
      }
    };
    fetchPurchase();
  }, [purchaseId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseId) return;

    setIsProcessing(true);
    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      await dbApi.purchases.update(parseInt(purchaseId), { status: "PAID" });
      toast.success("Payment successful! Your tickets are on their way.");
      navigate("/tickets");
    } catch (err) {
      toast.error("Payment failed. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  if (loading) return <Layout><Loading /></Layout>;
  if (!purchase) return null;

  return (
    <Layout>
      <div className="w-full max-w-4xl mx-auto py-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <BackButton text="Back to Purchases" />
          <h1 className="text-3xl font-bold">Secure Checkout</h1>
          <p className="text-base-content/70">Complete your payment for Purchase #{purchase.id.toString().padStart(6, '0')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 order-2 lg:order-1">
            <Card className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <CreditCard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Card Details</h2>
                  <p className="text-xs opacity-60">Transaction is encrypted and secure</p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Input
                  label="Name on Card"
                  placeholder="JOHN DOE"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  required
                />
                
                <Input
                  label="Card Number"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    maxLength={5}
                    required
                  />
                  <Input
                    label="CVV"
                    placeholder="123"
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ""))}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={isProcessing}
                  className={`btn btn-primary btn-lg w-full gap-2 ${isProcessing ? "loading" : ""}`}
                >
                  {isProcessing ? "Processing..." : `Pay €${parseFloat(purchase.total_price).toFixed(2)}`}
                </button>
                
                <div className="flex items-center justify-center gap-4 opacity-40 grayscale">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
                </div>
              </div>
            </Card>

            <div className="flex items-center gap-2 justify-center text-xs opacity-50 font-medium">
              <Lock size={12} />
              SSL SECURE PAYMENT
            </div>
          </form>

          {/* Order Summary */}
          <div className="order-1 lg:order-2 flex flex-col gap-6">
            <Card className="bg-base-200/50 border-none shadow-none p-6 flex flex-col gap-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                Order Summary
              </h2>
              
              <div className="flex flex-col gap-4">
                {purchase.tickets.map((ticket, idx) => (
                   <div key={ticket.id} className="flex justify-between items-start text-sm">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-base-300 flex items-center justify-center shrink-0">
                          <TicketIcon size={14} className="opacity-50" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold">Ticket {idx + 1}</span>
                          <span className="text-xs opacity-60">ID: #{ticket.id}</span>
                        </div>
                      </div>
                      <span className="font-bold">€{parseFloat(ticket.price_paid || "0").toFixed(2)}</span>
                   </div>
                ))}
              </div>

              <div className="divider my-0"></div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm opacity-70">
                  <span>Subtotal</span>
                  <span>€{parseFloat(purchase.total_price).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm opacity-70">
                  <span>Transaction Fee</span>
                  <span className="text-success">FREE</span>
                </div>
                <div className="flex justify-between items-baseline mt-2">
                  <span className="text-lg font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-primary">€{parseFloat(purchase.total_price).toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-success/10 p-4 rounded-xl flex gap-3 items-center text-success border border-success/20">
                <ShieldCheck size={20} className="shrink-0" />
                <p className="text-xs font-bold leading-tight uppercase tracking-tight">Your transaction is protected by 256-bit encryption</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;
