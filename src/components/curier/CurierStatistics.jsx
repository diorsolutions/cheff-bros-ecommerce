import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const CurierStatistics = ({ curierId, orders }) => {
  const [stats, setStats] = useState({
    totalDelivered: 0,
    todayDelivered: 0,
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

      orders.forEach(order => {
        // Faqat joriy kuryer tomonidan yetkazilgan buyurtmalarni hisoblaymiz
        if (order.curier_id === curierId && order.status === "confirmed") {
          totalDelivered++;
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === now.getTime()) {
            todayDelivered++;
          }
        }
      });

      setStats({
        totalDelivered: totalDelivered,
        todayDelivered: todayDelivered,
      });
      setLoading(false);
    };

    calculateStats();
  }, [curierId, orders]); // Buyurtmalar yoki kuryer ID o'zgarganda qayta hisoblash

  if (loading) {
    return <div className="text-center text-gray-400">Statistika yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-white mb-2">Bugungi buyurtmalar</h4>
          <p className="text-gray-300">Bugun yetkazilgan: <span className="font-bold text-green-400">{stats.todayDelivered}</span></p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-white mb-2">Jami yetkazilganlar</h4>
          <p className="text-gray-300">Jami yetkazilgan buyurtmalar: <span className="font-bold text-orange-400">{stats.totalDelivered}</span></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurierStatistics;