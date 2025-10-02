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
  Truck,
  Search, // Search ikonasi import qilindi
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
import { Input } from "@/components/ui/input"; // Input komponenti import qilindi
import { toast } from "@/components/ui/use-toast";
import { generateShortOrderId } from "@/lib/utils"; // Import the new utility function

const AdminDashboard = ({ orders, onUpdateOrderStatus, curiers }) => {
  const [prevOrdersCount, setPrevOrdersCount] = useState(orders.length);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("id"); // Default search by ID

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
      case "en_route_to_kitchen":
        return "bg-yellow-500";
      case "picked_up_from_kitchen":
        return "bg-orange-500";
      case "delivered_to_customer":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status, curierId) => {
    const courierName = getCurierName(curierId);
    switch (status) {
      case "new":
        return "Yangi";
      case "en_route_to_kitchen":
        return `${courierName} olish uchun yo'lda`;
      case "picked_up_from_kitchen":
        return `${courierName} buyurtmani oldi`;
      case "delivered_to_customer":
        return `${courierName} mijozga yetkazdi`;
      case "cancelled":
        return `${courierName} buyurtmani bekor qildi`;
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
    .filter((order) => {
      if (searchTerm.length < 3) return true; // Only filter if search term is 3+ chars

      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      switch (searchBy) {
        case "id":
          return generateShortOrderId(order.id).includes(lowerCaseSearchTerm); // Search by short ID
        case "customerName":
          return order.customer_info.name.toLowerCase().includes(lowerCaseSearchTerm);
        case "customerPhone":
          // Normalize phone numbers for comparison (remove non-numeric characters)
          const normalizedOrderPhone = order.customer_info.phone.replace(/[^0-9]/g, '');
          const normalizedSearchTerm = lowerCaseSearchTerm.replace(/[^0-9]/g, '');
          return normalizedOrderPhone.includes(normalizedSearchTerm);
        case "location":
          return order.location.toLowerCase().includes(lowerCaseSearchTerm);
        default:
          return true;
      }
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem value="all" className="text-white">
                  Hammasi
                </SelectItem>
                <SelectItem value="new" className="text-blue-400">
                  Yangi
                </SelectItem>
                <SelectItem
                  value="en_route_to_kitchen"
                  className="text-yellow-400"
                >
                  Olish uchun yo'lda
                </SelectItem>
                <SelectItem
                  value="picked_up_from_kitchen"
                  className="text-orange-400"
                >
                  Buyurtma menda
                </SelectItem>
                <SelectItem
                  value="delivered_to_customer"
                  className="text-green-400"
                >
                  Mijozda
                </SelectItem>
                <SelectItem value="cancelled" className="text-red-400">
                  Bekor qilingan
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px] bg-white/10 border-white/20 text-white">
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

      {/* Search Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto">
          <Select value={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-full sm:w-[150px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Qidirish bo'yicha" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="id" className="text-white">ID</SelectItem>
              <SelectItem value="customerName" className="text-white">Mijoz Ismi</SelectItem>
              <SelectItem value="customerPhone" className="text-white">Mijoz Telefon</SelectItem>
              <SelectItem value="location" className="text-white">Manzil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-auto flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">
                  {statusFilter === "all" && searchTerm.length < 3
                    ? "Hozircha buyurtmalar yo'q"
                    : "Bu mezonlarga mos buyurtmalar topilmadi"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => {
              const isFinal =
                order.status === "delivered_to_customer" ||
                order.status === "cancelled";
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
                      order.status === "delivered_to_customer"
                        ? "from-green-500/10 to-green-500/5 border-green-500/30 opacity-80"
                        : order.status === "cancelled"
                        ? "from-red-500/10 to-red-500/5 border-red-500/30 opacity-80"
                        : order.status === "picked_up_from_kitchen"
                        ? "from-orange-500/10 to-orange-500/5 border-orange-500/30"
                        : order.status === "en_route_to_kitchen"
                        ? "from-yellow-500/10 to-yellow-500/5 border-yellow-500/30"
                        : "from-white/10 to-white/5"
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-3 text-base sm:text-lg">
                          <span
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              order.status
                            )} ${
                              order.status === "new" ||
                              order.status === "en_route_to_kitchen" ||
                              order.status === "picked_up_from_kitchen"
                                ? "animate-pulse"
                                : ""
                            }`}
                          ></span>
                          Buyurtma{" "}
                          <span className="text-gray-400 text-sm">
                            {generateShortOrderId(order.id)}
                          </span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 hidden sm:inline">
                            {new Date(order.created_at).toLocaleString("uz-UZ")}
                          </span>
                          {!isFinal ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20"
                                  disabled={
                                    !!order.curier_id && order.status !== "new"
                                  } // Agar kuryer olgan bo'lsa, admin o'zgartira olmaydi
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-800 border-white/20">
                                {order.status === "new" && (
                                  <>
                                    <DropdownMenuItem
                                      onClick={
                                        () =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "en_route_to_kitchen",
                                            null
                                          ) // Admin o'zi buyurtma olmaydi, shuning uchun curierId null
                                      }
                                      className="text-yellow-400 hover:!bg-yellow-500/20 focus:bg-yellow-500/20 focus:text-yellow-300"
                                    >
                                      <Truck className="mr-2 h-4 w-4" />
                                      Olish uchun yo'lda (Admin)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={
                                        () =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "picked_up_from_kitchen",
                                            null
                                          ) // Admin o'zi buyurtma olmaydi, shuning uchun curierId null
                                      }
                                      className="text-orange-400 hover:!bg-orange-500/20 focus:bg-orange-500/20 focus:text-orange-300"
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      Buyurtma menda (Admin)
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(order.status === "en_route_to_kitchen" ||
                                  order.status === "picked_up_from_kitchen") &&
                                  !order.curier_id && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "delivered_to_customer",
                                            null
                                          )
                                        }
                                        className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mijozda (Admin)
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "cancelled",
                                            null
                                          )
                                        }
                                        className="text-red-400 hover:!bg-red-500/20 focus:bg-red-500/20 focus:text-red-300"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Bekor qilish (Admin)
                                      </DropdownMenuItem>
                                    </>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              {order.status === "delivered_to_customer"
                                ? "✓ Mijozga yetkazildi"
                                : "✗ Bekor qilingan"}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-white mb-2 text-base">
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
                              <a
                                className="underline text-blue-300"
                                href={`https://maps.google.com/?q=${order.location}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Xaritada ochish
                              </a>
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-white mb-2 text-base">
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
                                <span className="text-white/80 font-medium">
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
                                <span className="text-white text-lg">
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
                              : order.status === "en_route_to_kitchen"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : order.status === "picked_up_from_kitchen"
                              ? "bg-orange-500/20 text-orange-400"
                              : order.status === "delivered_to_customer"
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