import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const CurierStatistics = ({ curierId, orders }) => {
  const [stats, setStats] = useState({
    totalDelivered: 0,
    todayDelivered: 0,
    totalCancelled: 0, // Yangi: Jami bekor qilinganlar
    todayCancelled: 0, // Yangi: Bugungi bekor qilinganlar
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!curierId || !orders) return;

    setLoading(true);
    const calculateStats = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Bugunning boshlanishi

      let totalDelivered = 0;
      let todayDelivered = 0;
      let totalCancelled = 0;
      let todayCancelled = 0;

      orders.forEach(order => {
        if (order.curier_id === curierId) { // Faqat joriy kuryerga tegishli buyurtmalar
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);

          if (order.status === "delivered_to_customer") { // Yangi status nomi
            totalDelivered++;
            if (orderDate.getTime() === now.getTime()) {
              todayDelivered++;
            }
          } else if (order.status === "cancelled") {
            totalCancelled++;
            if (orderDate.getTime() === now.getTime()) {
              todayCancelled++;
            }
          }
        }
      });

      setStats({
        totalDelivered: totalDelivered,
        todayDelivered: todayDelivered,
        totalCancelled: totalCancelled,
        todayCancelled: todayCancelled,
      });
      setLoading(false);
    };

    calculateStats();
  }, [curierId, orders]); // Buyurtmalar yoki kuryer ID o'zgarganda qayta hisoblash

  if (loading) {
    return <div className="text-center text-gray-600">Statistika yuklanmoqda...</div>; {/* Matn rangi yangilandi */}
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-gray-300"> {/* Card rangi va chegarasi yangilandi */}
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Bugungi buyurtmalar</h4> {/* Matn rangi yangilandi */}
          <p className="text-gray-600">Yetkazilgan: <span className="font-bold text-green-600">{stats.todayDelivered}</span></p> {/* Matn rangi yangilandi */}
          <p className="text-gray-600">Bekor qilingan: <span className="font-bold text-red-600">{stats.todayCancelled}</span></p> {/* Matn rangi yangilandi */}
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-300"> {/* Card rangi va chegarasi yangilandi */}
        <CardContent className="p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Jami yetkazilganlar</h4> {/* Matn rangi yangilandi */}
          <p className="text-gray-600">Jami yetkazilgan buyurtmalar: <span className="font-bold text-orange-500">{stats.totalDelivered}</span></p> {/* Matn rangi yangilandi */}
          <p className="text-gray-600">Jami bekor qilingan buyurtmalar: <span className="font-bold text-red-600">{stats.totalCancelled}</span></p> {/* Matn rangi yangilandi */}
        </CardContent>
      </Card>
    </div>
  );
};

export default CurierStatistics;