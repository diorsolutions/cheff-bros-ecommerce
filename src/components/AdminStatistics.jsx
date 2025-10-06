import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import {
  Utensils,
  Package,
  XCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChefHat,
  Salad, // Masalliqlar uchun icon
} from "lucide-react";
import { calculateProductStock } from "@/utils/stockCalculator"; // Import stock calculator
import { formatQuantity, formatPrice } from "@/lib/utils"; // formatQuantity va formatPrice import qilindi

const AdminStatistics = ({ orders, products, curiers, chefs, ingredients, productIngredients }) => {
  const [stats, setStats] = useState({
    totalDeliveredOrders: 0,
    totalCancelledOrders: 0,
    dailyRevenue: 0,
    totalRevenue: 0,
    topSellingProducts: [], // Yangi: Eng ko'p sotilayotgan mahsulotlar
    totalIngredientsCount: 0,
    lowStockIngredientsCount: 0,
    outOfStockIngredientsCount: 0,
    top5LowestStockIngredients: [],
    courierStats: {},
    chefStats: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orders || !products || !curiers || !chefs || !ingredients || !productIngredients) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const calculateAdminStats = () => {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      let totalDeliveredOrders = 0;
      let totalCancelledOrders = 0;
      let dailyRevenue = 0;
      let totalRevenue = 0;
      const productSales = {}; // Eng ko'p sotilgan mahsulotlar uchun
      const courierPerformance = {};
      const chefPerformance = {};

      // Initialize courier stats
      curiers.forEach((curier) => {
        courierPerformance[curier.id] = {
          name: curier.name,
          todayDelivered: 0,
          todayCancelled: 0,
          totalDelivered: 0,
          totalCancelled: 0,
        };
      });

      // Initialize chef stats
      chefs.forEach((chef) => {
        chefPerformance[chef.id] = {
          name: chef.name,
          todayPrepared: 0,
          todayCancelled: 0,
          totalPrepared: 0,
          totalCancelled: 0,
        };
      });


      orders.forEach((order) => {
        const orderDate = new Date(order.created_at);
        orderDate.setHours(0, 0, 0, 0);

        if (order.status === "delivered_to_customer") {
          totalDeliveredOrders++;
          totalRevenue += order.total_price;
          if (orderDate.getTime() === now.getTime()) {
            dailyRevenue += order.total_price;
          }

          // Product sales calculation
          order.items.forEach((item) => {
            if (!productSales[item.id]) {
              const productInfo = products.find(p => p.id === item.id);
              productSales[item.id] = { name: productInfo ? productInfo.name : "Noma'lum mahsulot", count: 0, revenue: 0 };
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
          // Chef performance: If delivered, and a chef was assigned, count as prepared
          if (order.chef_id && chefPerformance[order.chef_id]) {
            chefPerformance[order.chef_id].totalPrepared++;
            if (orderDate.getTime() === now.getTime()) {
              chefPerformance[order.chef_id].todayPrepared++;
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
          // Chef performance for cancelled orders (if a chef was assigned)
          if (order.chef_id && chefPerformance[order.chef_id]) {
            chefPerformance[order.chef_id].totalCancelled++;
            if (orderDate.getTime() === now.getTime()) {
              chefPerformance[order.chef_id].todayCancelled++;
            }
          }
        } else if (order.status === "ready") { // Chef tayyorlagan buyurtmalar
          if (order.chef_id && chefPerformance[order.chef_id]) {
            chefPerformance[order.chef_id].totalPrepared++;
            if (orderDate.getTime() === now.getTime()) {
              chefPerformance[order.chef_id].todayPrepared++;
            }
          }
        }
      });

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 products

      // Calculate ingredient statistics
      const totalIngredientsCount = ingredients.length;
      const lowStockIngredientsCount = ingredients.filter(
        (ing) => ing.stock_quantity > 0 && ing.stock_quantity < 10
      ).length;
      const outOfStockIngredientsCount = ingredients.filter(
        (ing) => ing.stock_quantity === 0
      ).length;

      const top5LowestStockIngredients = ingredients
        .filter((ing) => ing.stock_quantity > 0) // Tugagan masalliqlarni hisobga olmaymiz
        .sort((a, b) => a.stock_quantity - b.stock_quantity)
        .slice(0, 5);


      setStats({
        totalDeliveredOrders,
        totalCancelledOrders,
        dailyRevenue,
        totalRevenue,
        topSellingProducts, // Yangi: Eng ko'p sotilayotgan mahsulotlar
        totalIngredientsCount,
        lowStockIngredientsCount,
        outOfStockIngredientsCount,
        top5LowestStockIngredients,
        courierStats: courierPerformance,
        chefStats: chefPerformance,
      });
      setLoading(false);
    };

    calculateAdminStats();
  }, [orders, products, curiers, chefs, ingredients, productIngredients]);

  if (loading) {
    return (
      <div className="text-center text-gray-600 py-8">
        Statistika yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-100 mb-6">
        Umumiy Statistika
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">
              Jami Yetkazilgan
            </CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalDeliveredOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">
              Jami Bekor Qilingan
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalCancelledOrders}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">
              Bugungi Daromad
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.dailyRevenue.toLocaleString()} so'm
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 border-gray-600">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/70">
              Jami Daromad
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalRevenue.toLocaleString()} so'm
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yangi: Eng ko'p sotilayotgan mahsulotlar Bo'limi */}
      <h2 className="text-3xl font-bold text-white/90 mb-6 mt-8">
        Mahsulotlar Statistikasi
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 border-gray-600">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white/70">
              Eng ko'p sotilayotgan mahsulotlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.topSellingProducts.length > 0 ? (
              stats.topSellingProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-white/70"
                >
                  <span className="text-white font-semibold">
                    {product.name}
                  </span>
                  <span className="font-medium">
                    {product.count} ta ({formatPrice(product.revenue)} so'm)
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-600">Ma'lumotlar yo'q</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-gray-600">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white/70">
              Eng kam qolgan masalliqlar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.top5LowestStockIngredients.length > 0 ? (
              stats.top5LowestStockIngredients.map((ingredient, index) => {
                let textColor = "text-green-600"; // Default to green

                if (ingredient.unit === 'dona') {
                  if (ingredient.stock_quantity < 13) {
                    textColor = "text-red-600";
                  } else if (ingredient.stock_quantity < 30) {
                    textColor = "text-orange-500";
                  }
                } else { // Assuming 'g', 'kg', 'ml', 'l' are liquid/weight
                  if (ingredient.stock_quantity < 3) {
                    textColor = "text-red-600";
                  } else if (ingredient.stock_quantity < 6) {
                    textColor = "text-orange-500";
                  }
                }

                return (
                  <div
                    key={index}
                    className="flex justify-between items-center text-white/70"
                  >
                    <span className="text-white font-semibold">
                      {ingredient.name}
                    </span>
                    <span className={`font-semibold ${textColor}`}>
                      {formatQuantity(ingredient.stock_quantity, ingredient.unit)} {ingredient.unit}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-600">Ma'lumotlar yo'q</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-3xl font-bold text-white/90 mb-6 mt-8">
        Kuryerlar Statistikasi
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(stats.courierStats).length > 0 ? (
          Object.values(stats.courierStats).map((courier, index) => (
            <Card key={index} className="bg-white/10 border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">
                  {courier.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-white/70">
                <p>
                  Bugun yetkazilgan:{" "}
                  <span className="font-bold text-green-600">
                    {courier.todayDelivered}
                  </span>
                </p>
                <p>
                  Bugun bekor qilingan:{" "}
                  <span className="font-bold text-red-600">
                    {courier.todayCancelled}
                  </span>
                </p>
                <p>
                  Jami yetkazilgan:{" "}
                  <span className="font-bold text-orange-500">
                    {courier.totalDelivered}
                  </span>
                </p>
                <p>
                  Jami bekor qilingan:{" "}
                  <span className="font-bold text-red-600">
                    {courier.totalCancelled}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-600 col-span-full">
            Kuryerlar haqida ma'lumotlar yo'q
          </p>
        )}
      </div>

      <h2 className="text-3xl font-bold text-white/90 mb-6 mt-8">
        Oshpazlar Statistikasi
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(stats.chefStats).length > 0 ? (
          Object.values(stats.chefStats).map((chef, index) => (
            <Card key={index} className="bg-white/10 border-gray-600">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">
                  {chef.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-white/70">
                <p>
                  Bugun tayyorlangan:{" "}
                  <span className="font-bold text-green-600">
                    {chef.todayPrepared}
                  </span>
                </p>
                <p>
                  Bugun bekor qilingan:{" "}
                  <span className="font-bold text-red-600">
                    {chef.todayCancelled}
                  </span>
                </p>
                <p>
                  Jami tayyorlangan:{" "}
                  <span className="font-bold text-orange-500">
                    {chef.totalPrepared}
                  </span>
                </p>
                <p>
                  Jami bekor qilingan:{" "}
                  <span className="font-bold text-red-600">
                    {chef.totalCancelled}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-gray-600 col-span-full">
            Oshpazlar haqida ma'lumotlar yo'q
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminStatistics;