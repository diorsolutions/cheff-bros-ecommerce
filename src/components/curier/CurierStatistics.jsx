import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const CurierStatistics = ({ curierId, orders }) => {
  const [stats, setStats] = useState({
    totalDelivered: 0,
    todayDelivered: 0,
    yesterdayDelivered: 0,
    lastWeekDelivered: 0,
    lastMonthDelivered: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!curierId || !orders) return;

    setLoading(true);
    const calculateStats = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Bugunning boshlanishi

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const lastWeek = new Date(now);
      lastWeek.setDate(now.getDate() - 7);

      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);

      let total = 0;
      let today = 0;
      let yesterdayCount = 0;
      let lastWeekCount = 0;
      let lastMonthCount = 0;

      orders.forEach(order => {
        if (order.curier_id === curierId && order.status === "confirmed") {
          total++;
          const orderDate = new Date(order.created_at);
          orderDate.setHours(0, 0, 0, 0);

          if (orderDate.getTime() === now.getTime()) {
            today++;
          }
          if (orderDate.getTime() === yesterday.getTime()) {
            yesterdayCount++;
          }
          if (orderDate >= lastWeek) {
            lastWeekCount++;
          }
          if (orderDate >= lastMonth) {
            lastMonthCount++;
          }
        }
      });

      setStats({
        totalDelivered: total,
        todayDelivered: today,
        yesterdayDelivered: yesterdayCount,
        lastWeekDelivered: lastWeekCount,
        lastMonthDelivered: lastMonthCount,
      });
      setLoading(false);
    };

    calculateStats();
  }, [curierId, orders]);

  if (loading) {
    return <div className="text-center text-gray-400">Statistika yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-white mb-2">Umumiy statistika</h4>
          <p className="text-gray-300">Jami yetkazilgan buyurtmalar: <span className="font-bold text-orange-400">{stats.totalDelivered}</span></p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-white mb-2">Kunlik statistika</h4>
          <p className="text-gray-300">Bugun yetkazilgan: <span className="font-bold text-green-400">{stats.todayDelivered}</span></p>
          <p className="text-gray-300">Kecha yetkazilgan: <span className="font-bold text-green-400">{stats.yesterdayDelivered}</span></p>
        </CardContent>
      </Card>

      <Card className="bg-white/10 border-white/20">
        <CardContent className="p-4">
          <h4 className="font-semibold text-white mb-2">Davr bo'yicha statistika</h4>
          <p className="text-gray-300">Oxirgi 7 kun ichida: <span className="font-bold text-purple-400">{stats.lastWeekDelivered}</span></p>
          <p className="text-gray-300">Oxirgi 30 kun ichida: <span className="font-bold text-purple-400">{stats.lastMonthDelivered}</span></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurierStatistics;