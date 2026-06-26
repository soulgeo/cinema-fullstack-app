import { BarChart } from "@mui/x-charts"
import Layout from "../layout/Layout"
import { useEffect, useState } from "react"
import type { Purchase } from "../../api/types";
import { dbApi } from "../../api/db";
import toast from "react-hot-toast";

const AdminPanel = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const purchasesData = await dbApi.purchases.list({});
        setPurchases(purchasesData);
      } catch {
        const err = "Failed to fetch panel data";
        toast.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <div className="w-full py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Admin Panel</h1>
            <p className="text-base-content/70">Sales Report</p>
          </div>
        </header>
        <div>
          <BarChart
            xAxis={[
              {
                id: 'barCategories',
                data: ['bar A', 'bar B', 'bar C'],
                height: 28,
              },
            ]}
            series={[
              {
                data: [2, 5, 3],
              },
            ]}
            height={300}
          />
        </div>
      </div>
    </Layout>
  )
}

export default AdminPanel
