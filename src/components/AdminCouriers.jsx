import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { User, Phone, Package, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const AdminCouriers = ({ curiers, orders }) => {
  const [courierStats, setCourierStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!curiers || !orders) return;

    setLoading(true);
    const calculateCourierStats = () => {
      const stats = {};
      curiers.forEach(curier => {
        stats[curier.id] = {
          name: curier.name,
          phone: curier.phone,
          totalDelivered: 0,
          totalCancelled: 0,
        };
      });

      orders.forEach(order => {
        if (order.curier_id && stats[order.curier_id]) {
          if (order.status === "confirmed") {
            stats[order.curier_id].totalDelivered++;
          } else if (order.status === "cancelled") {
            stats[order.curier_id].totalCancelled++;
          }
        }
      });
      setCourierStats(stats);
      setLoading(false);
    };

    calculateCourierStats();
  }, [curiers, orders]);

  if (loading) {
    return <div className="text-center text-gray-400 py-8">Kuryerlar yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Kuryerlar</h1>
      <div className="grid gap-4">
        <AnimatePresence>
          {Object.values(courierStats).length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">Hozircha kuryerlar yo'q.</p>
              </CardContent>
            </Card>
          ) : (
            Object.values(courierStats).map((courier, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="bg-white/10 border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-400" />
                      {courier.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-gray-300">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      Telefon: <span className="font-medium text-white">{courier.phone || "Kiritilmagan"}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-400" />
                      Jami yetkazilgan: <span className="font-bold text-green-400">{courier.totalDelivered}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      Jami bekor qilingan: <span className="font-bold text-red-400">{courier.totalCancelled}</span>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminCouriers;