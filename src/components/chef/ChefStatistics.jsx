import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

const ChefStatistics = ({ chefId, orders }) => {
  const [stats, setStats] = useState({
    totalPrepared: 0,
    todayPrepared: 0,
    totalCancelled: 0,
    todayCancelled: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chefId || !orders) {
      console.log("ChefStatistics: Missing chefId or orders", { chefId, orders });
      setLoading(false);
      return;
    }

    setLoading(true);
    const calculateStats = () => {
      console.log("ChefStatistics: Calculating stats for chefId:", chefId);
      console.log("ChefStatistics: All orders received:", orders);

      const now = new Date();
      now.setHours(0, 0, 0, 0); // Bugunning boshlanishi

      let totalPrepared = 0;
      let todayPrepared = 0;
      let totalCancelled = 0;
      let todayCancelled = 0;

      orders.forEach((order) => {
        if (order.chef_id === chefId) {
          console.log("ChefStatistics: Processing order for this chef:", order.id, "Status:", order.status);
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);

          if (order.status === "ready") {
            // Oshpaz tomonidan tayyorlangan buyurtmalar
            totalPrepared++;
            if (orderDate.getTime() === now.getTime()) {
              todayPrepared++;
            }
            console.log("ChefStatistics: Order is READY. totalPrepared:", totalPrepared);
          } else if (order.status === "cancelled") {
            // Oshpaz tomonidan bekor qilingan buyurtmalar
            totalCancelled++;
            if (orderDate.getTime() === now.getTime()) {
              todayCancelled++;
            }
            console.log("ChefStatistics: Order is CANCELLED. totalCancelled:", totalCancelled);
          }
        }
      });

      setStats({
        totalPrepared: totalPrepared,
        todayPrepared: todayPrepared,
        totalCancelled: totalCancelled,
        todayCancelled: todayCancelled,
      });
      setLoading(false);
      console.log("ChefStatistics: Final stats:", { totalPrepared, todayPrepared, totalCancelled, todayCancelled });
    };

    calculateStats();
  }, [chefId, orders]); // Buyurtmalar yoki kuryer ID o'zgarganda qayta hisoblash

  if (loading) {
    return (
      <div className="text-center text-gray-600">Statistika yuklanmoqda...</div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-300">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            Bugungi buyurtmalar
          </h4>
          <p className="text-gray-600">
            Tayyorlangan:{" "}
            <span className="font-bold text-green-600">
              {stats.todayPrepared}
            </span>
          </p>
          <p className="text-gray-600">
            Bekor qilingan:{" "}
            <span className="font-bold text-red-600">
              {stats.todayCancelled}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-300">
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 mb-2">
            Jami tayyorlanganlar
          </h4>
          <p className="text-gray-600">
            Jami tayyorlangan buyurtmalar:{" "}
            <span className="font-bold text-orange-500">
              {stats.totalPrepared}
            </span>
          </p>
          <p className="text-gray-600">
            Jami bekor qilingan buyurtmalar:{" "}
            <span className="font-bold text-red-600">
              {stats.totalCancelled}
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChefStatistics;