import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Filter,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

const AdminDashboard = ({ orders, onUpdateOrderStatus, curiers }) => {
  const [prevOrdersCount, setPrevOrdersCount] = useState(orders.length);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    const newOrders = orders.filter((order) => order.status === "new");
    const prevNewOrders =
      prevOrdersCount > 0
        ? orders
            .slice(orders.length - prevOrdersCount)
            .filter((o) => o.status === "new")
        : [];

    if (newOrders.length > prevNewOrders.length && prevOrdersCount > 0) {
      toast({
        title: "🔔 Yangi buyurtma!",
        description: `${
          newOrders.length - prevNewOrders.length
        } ta yangi buyurtma keldi`,
      });
    }
    setPrevOrdersCount(orders.length);
  }, [orders]);

  const getCurierName = (curierId) => {
    const curier = curiers.find((c) => c.id === curierId);
    return curier ? curier.name : "Noma'lum kuryer";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "on_the_way":
        return "bg-orange-500";
      case "confirmed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status, curierId) => {
    switch (status) {
      case "new":
        return "Yangi";
      case "on_the_way":
        return `${getCurierName(curierId)} buyurtmani oldi`;
      case "confirmed":
        return `${getCurierName(curierId)} mijozga yetkazdi`;
      case "cancelled":
        return `${getCurierName(curierId)} buyurtmani bekor qildi`; // Yangilangan qism
      default:
        return "Noma'lum";
    }
  };

  const newOrdersCount = orders.filter((o) => o.status === "new").length;

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter === "all") return true;
      return order.status === statusFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.created_at) - new Date(a.created_at);
        case "date-asc":
          return new Date(a.created_at) - new Date(b.created_at);
        case "price-desc":
          return b.total_price - a.total_price;
        case "price-asc":
          return a.total_price - b.total_price;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Buyurtmalar</h1>
        <div className="flex items-center gap-2 bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
          <Bell className="h-5 w-5 text-blue-400" />
          <span className="text-blue-400 font-medium">
            {newOrdersCount} yangi buyurtma
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem value="all" className="text-white">
                  Hammasi
                </SelectItem>
                <SelectItem value="new" className="text-blue-400">
                  Yangi
                </SelectItem>
                <SelectItem value="on_the_way" className="text-orange-400">
                  Yo'lda
                </SelectItem>
                <SelectItem value="confirmed" className="text-green-400">
                  Yetkazildi
                </SelectItem>
                <SelectItem value="cancelled" className="text-red-400">
                  Bekor qilingan
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[200px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Tartiblash" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="date-desc" className="text-white">
                Sana: Yangi → Eski
              </SelectItem>
              <SelectItem value="date-asc" className="text-white">
                Sana: Eski → Yangi
              </SelectItem>
              <SelectItem value="price-desc" className="text-white">
                Narx: Yuqori → Past
              </SelectItem>
              <SelectItem value="price-asc" className="text-white">
                Narx: Past → Yuqori
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">
                  {statusFilter === "all"
                    ? "Hozircha buyurtmalar yo'q"
                    : "Bu statusda buyurtmalar yo'q"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const isProcessed = order.status !== "new";
              const isFinal = order.status === "confirmed" || order.status === "cancelled";
              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card
                    className={`bg-gradient-to-br backdrop-blur-lg border-white/20 hover:border-white/30 transition-all duration-300 ${
                      order.status === "confirmed"
                        ? "from-green-500/10 to-green-500/5 border-green-500/30 opacity-80"
                        : order.status === "cancelled"
                        ? "from-red-500/10 to-red-500/5 border-red-500/30 opacity-80"
                        : order.status === "on_the_way"
                        ? "from-orange-500/10 to-orange-500/5 border-orange-500/30"
                        : "from-white/10 to-white/5"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-3 text-base">
                          <span
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              order.status
                            )} ${
                              order.status === "new" ? "animate-pulse" : ""
                            }`}
                          ></span>
                          Buyurtma{" "}
                          <span className="text-gray-400">
                            {order.id.substring(0, 8)}
                          </span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">
                            {new Date(order.created_at).toLocaleString("uz-UZ")}
                          </span>
                          {!isFinal ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-white/20">
                                {order.status === "new" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateOrderStatus(order.id, "on_the_way", null) // Admin o'zi buyurtma olmaydi, shuning uchun curierId null
                                    }
                                    className="text-orange-400 hover:!bg-orange-500/20 focus:bg-orange-500/20 focus:text-orange-300"
                                  >
                                    <Package className="mr-2 h-4 w-4" />
                                    Buyurtma menda (Admin)
                                  </DropdownMenuItem>
                                )}
                                {order.status === "on_the_way" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(order.id, "confirmed", order.curier_id)
                                      }
                                      className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Yetkazib berildi (Admin)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(order.id, "cancelled", order.curier_id)
                                      }
                                      className="text-red-400 hover:!bg-red-500/20 focus:bg-red-500/20 focus:text-red-300"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Bekor qilish (Admin)
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {/* Admin uchun qo'shimcha statuslar */}
                                {order.status !== "new" && order.status !== "on_the_way" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(order.id, "confirmed", order.curier_id)
                                      }
                                      className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Tasdiqlash
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(order.id, "cancelled", order.curier_id)
                                      }
                                      className="text-red-400 hover:!bg-red-500/20 focus:bg-red-500/20 focus:text-red-300"
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Bekor qilish
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {order.status === "confirmed"
                                ? "✓ Yetkazib berildi"
                                : "✗ Bekor qilingan"}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-white mb-2">
                            Mijoz ma'lumotlari
                          </h4>
                          <div className="space-y-2 text-sm text-gray-300">
                            <p>
                              <span className="font-bold text-gray-100/50">
                                Ism:
                              </span>{" "}
                              {order.customer_info.name}
                            </p>
                            <p>
                              <span className="font-bold text-gray-100/50">
                                Telefon:
                              </span>{" "}
                              {order.customer_info.phone}
                            </p>
                            <p>
                              <span className="font-bold text-gray-100/50">
                                Manzil:
                              </span>{" "}
                              {order.location}
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-white mb-2">
                            Buyurtma tafsilotlari
                          </h4>
                          <div className="space-y-1">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-300">
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="text-orange-400 font-medium">
                                  {(
                                    item.price * item.quantity
                                  ).toLocaleString()}{" "}
                                  so'm
                                </span>
                              </div>
                            ))}
                            <div className="border-t border-white/20 pt-2 mt-2">
                              <div className="flex justify-between font-bold">
                                <span className="text-white">Jami:</span>
                                <span className="text-orange-400 text-lg">
                                  {order.total_price.toLocaleString()} so'm
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-400">Status:</span>
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded ${
                            order.status === "new"
                              ? "bg-blue-500/20 text-blue-400"
                              : order.status === "on_the_way"
                              ? "bg-orange-500/20 text-orange-400"
                              : order.status === "confirmed"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {getStatusText(order.status, order.curier_id)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;