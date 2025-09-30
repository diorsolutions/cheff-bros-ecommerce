import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { Utensils, Package, XCircle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

const AdminStatistics = ({ orders, products, curiers }) => {
  const [stats, setStats] = useState({
    totalDeliveredOrders: 0,
    totalCancelledOrders: 0,
    dailyRevenue: 0,
    totalRevenue: 0,
    topSellingProducts: [],
    leastSellingProducts: [],
    courierStats: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orders || !products || !curiers) return;

    setLoading(true);
    const calculateAdminStats = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let totalDeliveredOrders = 0;
      let totalCancelledOrders = 0;
      let dailyRevenue = 0;
      let totalRevenue = 0;
      const productSales = {}; // { productId: { name: '...', count: N, revenue: M } }
      const courierPerformance = {}; // { curierId: { name: '...', todayDelivered: N, todayCancelled: M, totalDelivered: P, totalCancelled: Q } }

      // Initialize courier stats
      curiers.forEach(curier => {
        courierPerformance[curier.id] = {
          name: curier.name,
          todayDelivered: 0,
          todayCancelled: 0,
          totalDelivered: 0,
          totalCancelled: 0,
        };
      });

      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);

        if (order.status === "confirmed") {
          totalDeliveredOrders++;
          totalRevenue += order.total_price;
          if (orderDate.getTime() === now.getTime()) {
            dailyRevenue += order.total_price;
          }

          // Product sales
          order.items.forEach(item => {
            if (!productSales[item.id]) {
              productSales[item.id] = { name: item.name, count: 0, revenue: 0 };
            }
            productSales[item.id].count += item.quantity;
            productSales[item.id].revenue += item.price * item.quantity;
          });

          // Courier performance
          if (order.curier_id && courierPerformance[order.curier_id]) {
            courierPerformance[order.curier_id].totalDelivered++;
            if (orderDate.getTime() === now.getTime()) {
              courierPerformance[order.curier_id].todayDelivered++;
            }
          }
        } else if (order.status === "cancelled") {
          totalCancelledOrders++;
          // Courier performance for cancelled orders
          if (order.curier_id && courierPerformance[order.curier_id]) {
            courierPerformance[order.curier_id].totalCancelled++;
            if (orderDate.getTime() === now.getTime()) {
              courierPerformance[order.curier_id].todayCancelled++;
            }
          }
        }
      });

      // Sort products by sales count
      const sortedProducts = Object.values(productSales).sort((a, b) => b.count - a.count);
      const topSellingProducts = sortedProducts.slice(0, 5);
      const leastSellingProducts = sortedProducts.slice(-5).reverse(); // Eng kam sotilganlar

      setStats({
        totalDeliveredOrders,
        totalCancelledOrders,
        dailyRevenue,
        totalRevenue,
        topSellingProducts,
        leastSellingProducts,
        courierStats: courierPerformance,
      });
      setLoading(false);
    };

    calculateAdminStats();
  }, [orders, products, curiers]);

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Statistika yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white mb-6">Umumiy Statistika</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Jami Yetkazilgan</CardTitle>
            <Package className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalDeliveredOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Jami Bekor Qilingan</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalCancelledOrders}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Bugungi Daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.dailyRevenue.toLocaleString()} so'm</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Jami Daromad</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()} so'm</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Eng ko'p sotilgan mahsulotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topSellingProducts.length > 0 ? (
              stats.topSellingProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center text-gray-300">
                  <span>{product.name}</span>
                  <span className="font-medium text-green-400">{product.count} dona</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Ma'lumotlar yo'q</p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">Eng kam sotilgan mahsulotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.leastSellingProducts.length > 0 ? (
              stats.leastSellingProducts.map((product, index) => (
                <div key={index} className="flex justify-between items-center text-gray-300">
                  <span>{product.name}</span>
                  <span className="font-medium text-red-400">{product.count} dona</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400">Ma'lumotlar yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-3xl font-bold text-white mb-6 mt-8">Kuryerlar Statistikasi</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(stats.courierStats).length > 0 ? (
          Object.values(stats.courierStats).map((courier, index) => (
            <Card key={index} className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">{courier.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-gray-300">
                <p>Bugun yetkazilgan: <span className="font-bold text-green-400">{courier.todayDelivered}</span></p>
                <p>Bugun bekor qilingan: <span className="font-bold text-red-400">{courier.todayCancelled}</span></p>
                <p>Jami yetkazilgan: <span className="font-bold text-orange-400">{courier.totalDelivered}</span></p>
                <p>Jami bekor qilingan: <span className="font-bold text-red-400">{courier.totalCancelled}</span></p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-400 col-span-full">Kuryerlar haqida ma'lumotlar yo'q</p>
        )}
      </div>
    </div>
  );
};

export default AdminStatistics;