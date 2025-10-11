import React, { useState, useEffect, useRef } from "react";
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
  Search,
  Utensils,
  ChefHat,
  MapPin, // MapPin iconini import qilish
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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { generateShortOrderId, cn, getMapLinks } from "@/lib/utils"; // cn va getMapLinks import qilindi
import InfoModal from "./InfoModal";
// import OrderItemsModal from "./OrderItemsModal"; // Yangi: OrderItemsModal import qilindi
import { useLocalStorage } from "@/hooks/useLocalStorage"; // useLocalStorage import qilildi
import { useMediaQuery } from "react-responsive"; // useMediaQuery import qilildi

// Umumiy tovush ijro etish funksiyasi
const playSound = (
  audioRef,
  setHasInteracted,
  hasInteracted,
  toastTitle,
  toastDescription
) => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0; // Tovushni boshidan boshlash
    audioRef.current
      .play()
      .then(() => {
        setHasInteracted(true); // Muvaffaqiyatli ijro etildi, foydalanuvchi o'zaro aloqada bo'ldi
      })
      .catch((e) => {
        if (e.name === "NotAllowedError" && !hasInteracted) {
          // Faqat NotAllowedError bo'lsa va hali ko'rsatilmagan bo'lsa toast ko'rsatish
          toast({
            title: toastTitle,
            description: toastDescription,
            action: (
              <Button
                onClick={() => {
                  audioRef.current
                    .play()
                    .then(() => {
                      setHasInteracted(true); // Foydalanuvchi tugmani bosdi, o'zaro aloqa bo'ldi
                      toast({
                        title: "Tovush yoqildi!",
                        description:
                          "Bildirishnoma tovushlari endi ijro etiladi.",
                      });
                    })
                    .catch((err) => console.error("Manual play failed:", err));
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Tovushni yoqish
              </Button>
            ),
            duration: 10000, // Uzoqroq ko'rsatish
          });
        } else if (e.name === "NotSupportedError") {
          toast({
            title: "Tovush fayli xatosi",
            description:
              "Tovush fayli ijro etib bo'lmaydi. Iltimos, faylni tekshiring.",
            variant: "destructive",
          });
        } else {
          console.error("Error playing sound:", e);
        }
      });
  }
};

const AdminDashboard = ({ orders, onUpdateOrderStatus, curiers, chefs }) => {
  const [prevOrdersCount, setPrevOrdersCount] = useState(orders.length);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("id");

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalDescription, setInfoModalDescription] = useState("");
  const [infoModalDetails, setInfoModalDetails] = useState([]);

  // const [showOrderItemsModal, setShowOrderItemsModal] = useState(false); // Yangi: OrderItemsModal holati
  // const [currentOrderItems, setCurrentOrderItems] = useState([]); // Yangi: Joriy buyurtma mahsulotlari
  // const [currentOrderShortId, setCurrentOrderShortId] = useState(""); // Yangi: Joriy buyurtma ID

  const adminOrderSound = useRef(new Audio("/notification_admin_order.mp3"));
  const [hasInteracted, setHasInteracted] = useLocalStorage(
    "adminHasInteracted",
    false
  ); // Admin uchun hasInteracted

  const isMobile = useMediaQuery({ maxWidth: 768 }); // Mobil qurilmani aniqlash

  const playAdminOrderSound = () => {
    playSound(
      adminOrderSound,
      setHasInteracted,
      hasInteracted,
      "Admin tovushini yoqish kerak",
      "Yangi buyurtma tovushini eshitish uchun sahifa bilan o'zaro aloqada bo'ling (masalan, tugmani bosing)."
    );
  };

  // Komponent yuklanganda tovushni proaktiv yoqishga urinish
  useEffect(() => {
    if (!hasInteracted) {
      playAdminOrderSound();
    }
  }, [hasInteracted]);

  useEffect(() => {
    // Faqat yangi buyurtmalar kelganda tovush va toast ko'rsatish
    const newOrders = orders.filter((order) => order.status === "new");
    const prevNewOrdersCount = prevOrdersCount;

    if (newOrders.length > prevNewOrdersCount) {
      playAdminOrderSound(); // playSound funksiyasini chaqirish
      toast({
        title: "🔔 Yangi buyurtma!",
        description: `${
          newOrders.length - prevNewOrdersCount
        } ta yangi buyurtma keldi`,
      });
    }
    setPrevOrdersCount(newOrders.length);
  }, [orders, hasInteracted]); // hasInteracted ni dependency qilib qo'shdik

  const getCurierInfo = (curierId) => {
    return curiers.find((c) => c.id === curierId);
  };

  const getChefInfo = (chefId) => {
    return chefs.find((c) => c.id === chefId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "preparing":
        return "bg-yellow-500";
      case "ready":
        return "bg-green-500";
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

  const handleShowUserInfo = (user, role) => {
    setInfoModalTitle(
      `${role === "curier" ? "Kuryer" : "Oshpaz"} ma'lumotlari`
    );
    setInfoModalDescription("");
    setInfoModalDetails([
      { label: "Ism", value: user.name },
      { label: "Telefon", value: user.phone || "Kiritilmagan" },
    ]);
    setShowInfoModal(true);
  };

  const renderUserLink = (user, role) => (
    <p
      onClick={() => handleShowUserInfo(user, role)}
      className="inline underline cursor-pointer"
    >
      {user?.name || "Noma'lum"}
    </p>
  );

  const getDetailedStatusText = (
    status,
    curierId,
    chefId,
    cancellationReason,
    orderObject
  ) => {
    const courierInfo = curierId ? getCurierInfo(curierId) : null;
    const chefInfo = chefId ? getChefInfo(chefId) : null;
    const isPickup = orderObject.delivery_option === "o_zim_olib_ketaman";

    let statusText = "";

    if (status === "cancelled") {
      if (orderObject.curier_id && orderObject.cancellation_reason) {
        statusText = (
          <>Kuryer: {renderUserLink(courierInfo, "curier")} bekor qildi</>
        );
        if (chefInfo) {
          statusText = (
            <>
              Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorladi!{" "}
              {statusText}
            </>
          );
        }
      } else if (orderObject.chef_id && orderObject.cancellation_reason) {
        statusText = (
          <>Oshpaz: {renderUserLink(chefInfo, "chef")} bekor qildi</>
        );
      } else {
        statusText = "Bekor qilingan";
        if (chefInfo) statusText += ` (Oshpaz: ${chefInfo.name})`;
        if (courierInfo) statusText += ` (Kuryer: ${courierInfo.name})`;
      }
    } else if (isPickup) {
      switch (status) {
        case "new":
          statusText = "Yangi (Olib ketish)";
          break;
        case "preparing":
          statusText = (
            <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorlanmoqda</>
          );
          break;
        case "ready":
          statusText = (
            <>
              Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorladi (Olib
              ketishga tayyor)
            </>
          );
          break;
        case "delivered_to_customer":
          statusText = (
            <>
              Oshpaz: {renderUserLink(chefInfo, "chef")} mijozga topshirdi (Olib
              ketildi)
            </>
          );
          break;
        default:
          statusText = "Noma'lum (Olib ketish)";
          break;
      }
    } else if (curierId) {
      switch (status) {
        case "en_route_to_kitchen":
          statusText = (
            <>
              Kuryer: {renderUserLink(courierInfo, "curier")} olish uchun yo'lda
            </>
          );
          break;
        case "picked_up_from_kitchen":
          statusText = (
            <>Kuryer: {renderUserLink(courierInfo, "curier")} buyurtmani oldi</>
          );
          break;
        case "delivered_to_customer":
          statusText = (
            <>
              Kuryer: {renderUserLink(courierInfo, "curier")} mijozga yetkazdi
            </>
          );
          break;
        default:
          statusText = (
            <>
              Kuryer: {renderUserLink(courierInfo, "curier")} - olish uchun
              yo'lda
            </>
          );
          break;
      }
    } else if (chefId) {
      switch (status) {
        case "preparing":
          statusText = (
            <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorlanmoqda</>
          );
          break;
        case "ready":
          statusText = (
            <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorladi</>
          );
          break;
        default:
          statusText = (
            <>Oshpaz: {renderUserLink(chefInfo, "chef")} oshpaz kutilmoqda</>
          );
          break;
      }
    } else {
      switch (status) {
        case "new":
          statusText = "Yangi";
          break;
        default:
          statusText = "Noma'lum";
          break;
      }
    }
    return statusText;
  };

  const handleShowCancellationReason = (reason) => {
    setInfoModalTitle("Bekor qilish sababi");
    setInfoModalDescription(reason);
    setInfoModalDetails([]);
    setShowInfoModal(true);
  };

  const newOrdersCount = orders.filter((o) => o.status === "new").length;

  const filteredOrders = orders
    .filter((order) => {
      if (statusFilter === "all") return true;
      return order.status === statusFilter;
    })
    .filter((order) => {
      if (searchTerm.length < 3) return true;

      const lowerCaseSearchTerm = searchTerm.toLowerCase();

      switch (searchBy) {
        case "id":
          return generateShortOrderId(order.id).includes(lowerCaseSearchTerm);
        case "customerName":
          return order.customer_info.name
            .toLowerCase()
            .includes(lowerCaseSearchTerm);
        case "customerPhone":
          const normalizedOrderPhone = order.customer_info.phone.replace(
            /[^0-9]/g,
            ""
          );
          const normalizedSearchTerm = lowerCaseSearchTerm.replace(
            /[^0-9]/g,
            ""
          );
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
        <motion.div
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300",
            newOrdersCount > 0
              ? "bg-gradient-to-r from-red-500 to-yellow-500 border-red-400 animate-newOrderPulse rounded-[0.6rem]"
              : "bg-blue-500/20 border-blue-500/30 rounded-[1rem]"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Bell
            className={cn(
              "h-5 w-5",
              newOrdersCount > 0 ? "text-white" : "text-blue-400"
            )}
          />
          <span
            className={cn(
              "font-medium",
              newOrdersCount > 0 ? "text-white" : "text-blue-400"
            )}
          >
            {newOrdersCount} yangi buyurtma
          </span>
        </motion.div>
      </div>

      <div className="flex justify-between flex-row-reverse">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20 hover:text-white/60 custom-select-content custom-select-content-active">
                  <SelectItem
                    value="all"
                    className="text-white *:hover:cursor-pointer"
                  >
                    Hammasi
                  </SelectItem>
                  <SelectItem
                    value="new"
                    className="text-blue-400 *:hover:cursor-pointer"
                  >
                    Yangi
                  </SelectItem>
                  <SelectItem
                    value="preparing"
                    className="text-yellow-400 *:hover:cursor-pointer"
                  >
                    Tayyorlanmoqda (Oshpaz)
                  </SelectItem>
                  <SelectItem
                    value="ready"
                    className="text-green-400 *:hover:cursor-pointer"
                  >
                    Tayyor (Oshpaz)
                  </SelectItem>
                  <SelectItem
                    value="en_route_to_kitchen"
                    className="text-yellow-400 *:hover:cursor-pointer"
                  >
                    Olish uchun yo'lda (Kuryer)
                  </SelectItem>
                  <SelectItem
                    value="picked_up_from_kitchen"
                    className="text-orange-400 *:hover:cursor-pointer"
                  >
                    Buyurtma menda (Kuryer)
                  </SelectItem>
                  <SelectItem
                    value="delivered_to_customer"
                    className="text-green-400 *:hover:cursor-pointer"
                  >
                    Mijozda (Kuryer)
                  </SelectItem>
                  <SelectItem
                    value="cancelled"
                    className="text-red-400 *:hover:cursor-pointer"
                  >
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
              <SelectContent className="bg-slate-800 border-white/20 *:hover:text-white/60 custom-select-content custom-select-content-active">
                <SelectItem
                  value="date-desc"
                  className="text-white *:hover:cursor-pointer hover:text-white"
                >
                  Sana: Yangi → Eski
                </SelectItem>
                <SelectItem
                  value="date-asc"
                  className="text-white *:hover:cursor-pointer hover:text-white"
                >
                  Sana: Eski → Yangi
                </SelectItem>
                <SelectItem
                  value="price-desc"
                  className="text-white *:hover:cursor-pointer hover:text-white"
                >
                  Narx: Yuqori → Past
                </SelectItem>
                <SelectItem
                  value="price-asc"
                  className="text-white *:hover:cursor-pointer hover:text-white"
                >
                  Narx: Past → Yuqori
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="w-full sm:w-auto">
            <Select value={searchBy} onValueChange={setSearchBy}>
              <SelectTrigger className="w-full sm:w-[150px] bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Qidirish bo'yicha" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20 custom-select-content custom-select-content-active">
                <SelectItem value="id" className="text-white">
                  ID
                </SelectItem>
                <SelectItem value="customerName" className="text-white">
                  Mijoz Ismi
                </SelectItem>
                <SelectItem value="customerPhone" className="text-white">
                  Mijoz Telefon
                </SelectItem>
                <SelectItem value="location" className="text-white">
                  Manzil
                </SelectItem>
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
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">
                  {statusFilter === "all" && searchTerm.length < 1
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
              const isEnRouteToKitchen = order.status === "en_route_to_kitchen";
              const isPickedUpFromKitchen =
                order.status === "picked_up_from_kitchen";

              const courierInfo = order.curier_id
                ? getCurierInfo(order.curier_id)
                : null;
              const chefInfo = order.chef_id
                ? getChefInfo(order.chef_id)
                : null;
              const detailedStatusText = getDetailedStatusText(
                order.status,
                order.curier_id,
                order.chef_id,
                order.cancellation_reason,
                order
              );

              // Asosiy status qismini yashirish sharti
              // Faqat yakuniy holatlarda (yetkazilgan/bekor qilingan) asosiy status yashiriladi.
              const hideMainStatus = isFinal;

              // Oshpaz ma'lumotini ko'rsatish sharti
              const showChefInfo =
                order.chef_id &&
                (order.curier_id || isFinal || order.status === "ready");

              // Kuryer ma'lumotini ko'rsatish sharti
              const showCourierInfo = order.curier_id && isFinal;

              const { yandexLink, googleLink, geoUri } = getMapLinks(
                order.coordinates?.lat,
                order.coordinates?.lng,
                order.location
              );

              const isPickup = order.delivery_option === "o_zim_olib_ketaman"; // Yangi: Olib ketish opsiyasi

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
                        : order.status === "ready"
                        ? "from-green-500/10 to-green-500/5 border-green-500/30"
                        : order.status === "picked_up_from_kitchen"
                        ? "from-orange-500/10 to-orange-500/5 border-orange-500/30"
                        : order.status === "en_route_to_kitchen" ||
                          order.status === "preparing"
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
                              order.status === "preparing" ||
                              order.status === "en_route_to_kitchen" ||
                              order.status === "picked_up_from_kitchen"
                                ? "animate-pulse"
                                : ""
                            }`}
                          ></span>
                          Buyurtma{" "}
                          <span className="text-gray-400 text-sm">
                            ID: {generateShortOrderId(order.id)}
                          </span>
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400 hidden sm:inline">
                            {(() => {
                              const date = new Date(order.created_at);
                              const day = date.getDate();
                              const year = date.getFullYear();
                              const hour = date
                                .getHours()
                                .toString()
                                .padStart(2, "0");
                              const minute = date
                                .getMinutes()
                                .toString()
                                .padStart(2, "0");

                              const monthNames = [
                                "yanvar",
                                "fevral",
                                "mart",
                                "aprel",
                                "may",
                                "iyun",
                                "iyul",
                                "avgust",
                                "sentyabr",
                                "oktyabr",
                                "noyabr",
                                "dekabr",
                              ];

                              const month = monthNames[date.getMonth()];

                              return `${year}, ${day}-${month}, soat: ${hour}:${minute}`;
                            })()}
                          </span>

                          {!order.curier_id && !order.chef_id && !isFinal ? (
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
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(
                                          order.id,
                                          "preparing",
                                          null,
                                          null
                                        )
                                      }
                                      className="text-yellow-400 hover:!bg-yellow-500/20 focus:bg-yellow-500/20 focus:text-yellow-300"
                                    >
                                      <Utensils className="mr-2 h-4 w-4" />
                                      Tayyorlanmoqda (Admin)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(
                                          order.id,
                                          "en_route_to_kitchen",
                                          null,
                                          null
                                        )
                                      }
                                      className="text-yellow-400 hover:!bg-yellow-500/20 focus:bg-yellow-500/20 focus:text-yellow-300"
                                    >
                                      <Truck className="mr-2 h-4 w-4" />
                                      Olish uchun yo'lda (Admin)
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {order.status === "preparing" &&
                                  !order.chef_id && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(
                                          order.id,
                                          "ready",
                                          null,
                                          null
                                        )
                                      }
                                      className="text-white/50 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Tayyor (Admin)
                                    </DropdownMenuItem>
                                  )}
                                {order.status === "en_route_to_kitchen" &&
                                  !order.curier_id && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(
                                          order.id,
                                          "picked_up_from_kitchen",
                                          null,
                                          null
                                        )
                                      }
                                      className="text-orange-400 hover:!bg-orange-500/20 focus:bg-orange-500/20 focus:text-orange-300"
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      Buyurtma menda (Admin)
                                    </DropdownMenuItem>
                                  )}
                                {order.status === "picked_up_from_kitchen" &&
                                  !order.curier_id && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "delivered_to_customer",
                                            null,
                                            null
                                          )
                                        }
                                        className="text-white/50 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mijozda (Admin)
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "cancelled",
                                            null,
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
                              {isFinal
                                ? order.status === "delivered_to_customer"
                                  ? "✓ Mijozga yetkazildi"
                                  : "✗ Bekor qilingan"
                                : "Biriktirilgan"}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        {/* Mijoz ma'lumotlari Card ichida */}
                        <Card className="bg-gray-500/20 border-white/10 shadow-lg rounded-lg p-4">
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
                                Yetkazib berish usuli:
                              </span>{" "}
                              <span className="font-medium text-white">
                                {order.delivery_option === "o_zim_olib_ketaman"
                                  ? "O'zim olib ketaman"
                                  : "Yetkazib berilsin"}
                              </span>
                            </p>
                            {!isPickup && ( // Agar "o'zim olib ketaman" bo'lmasa, manzilni ko'rsatish
                              <p>
                                <span className="font-bold text-gray-100/50">
                                  Manzil:
                                </span>{" "}
                                {order.coordinates ? ( // If coordinates exist (auto-location)
                                  isMobile ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="link"
                                          className="p-0 h-auto text-blue-300 hover:text-blue-200"
                                        >
                                          <MapPin className="mr-1 h-4 w-4" />
                                          (xaritada ochish)
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="bg-slate-800 border-white/20">
                                        {yandexLink && (
                                          <DropdownMenuItem asChild>
                                            <a
                                              href={yandexLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-white hover:!bg-white/20 focus:bg-white/20 focus:text-white"
                                            >
                                              Yandex Mapsda ochish
                                            </a>
                                          </DropdownMenuItem>
                                        )}
                                        {googleLink && (
                                          <DropdownMenuItem asChild>
                                            <a
                                              href={googleLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-white hover:!bg-white/20 focus:bg-white/20 focus:text-white"
                                            >
                                              Google Mapsda ochish
                                            </a>
                                          </DropdownMenuItem>
                                        )}
                                        {geoUri && (
                                          <DropdownMenuItem asChild>
                                            <a
                                              href={geoUri}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-white hover:!bg-white/20 focus:bg-white/20 focus:text-white"
                                            >
                                              Boshqa ilovada ochish
                                            </a>
                                          </DropdownMenuItem>
                                        )}
                                        {!yandexLink &&
                                          !googleLink &&
                                          !geoUri && (
                                            <DropdownMenuItem
                                              disabled
                                              className="text-gray-500"
                                            >
                                              Xarita havolalari mavjud emas
                                            </DropdownMenuItem>
                                          )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  ) : (
                                    <a
                                      className="underline text-blue-300"
                                      href={yandexLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      (xaritada ochish)
                                    </a>
                                  )
                                ) : (
                                  // If no coordinates (manual entry)
                                  <>
                                    {order.location}{" "}
                                    {order.location &&
                                      (isMobile ? (
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="link"
                                              className="p-0 h-auto text-blue-300 hover:text-blue-200"
                                            >
                                              <MapPin className="mr-1 h-4 w-4" />
                                              (xaritada ochish)
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent className="bg-slate-800 border-white/20">
                                            {yandexLink && (
                                              <DropdownMenuItem asChild>
                                                <a
                                                  href={yandexLink}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-white hover:!bg-white/20 focus:bg-white/20 focus:text-white"
                                                >
                                                  Yandex Mapsda ochish
                                                </a>
                                              </DropdownMenuItem>
                                            )}
                                            {googleLink && (
                                              <DropdownMenuItem asChild>
                                                <a
                                                  href={googleLink}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-white hover:!bg-white/20 focus:bg-white/20 focus:text-white"
                                                >
                                                  Google Mapsda ochish
                                                </a>
                                              </DropdownMenuItem>
                                            )}
                                            {geoUri && (
                                              <DropdownMenuItem asChild>
                                                <a
                                                  href={geoUri}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-white hover:!bg-white/20 focus:bg-white/20 focus:text-white"
                                                >
                                                  Boshqa ilovada ochish
                                                </a>
                                              </DropdownMenuItem>
                                            )}
                                            {!yandexLink &&
                                              !googleLink &&
                                              !geoUri && (
                                                <DropdownMenuItem
                                                  disabled
                                                  className="text-gray-500"
                                                >
                                                  Xarita havolalari mavjud emas
                                                </DropdownMenuItem>
                                              )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      ) : (
                                        <a
                                          className="underline text-blue-300"
                                          href={yandexLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          (xaritada ochish)
                                        </a>
                                      ))}
                                  </>
                                )}
                              </p>
                            )}
                          </div>
                        </Card>

                        {/* Buyurtma tafsilotlari Card ichida */}
                        <Card className="bg-gray-500/20 border-white/10 shadow-md rounded-lg p-4">
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
                        </Card>
                      </div>

                      {!hideMainStatus && ( // Asosiy status qatori faqat hideMainStatus false bo'lganda ko'rsatiladi
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Status:</span>
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              order.status === "new"
                                ? "bg-blue-500/20 text-blue-400"
                                : order.status === "preparing"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : order.status === "ready"
                                ? "bg-green-500/20 text-green-400"
                                : order.status === "en_route_to_kitchen"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : order.status === "picked_up_from_kitchen"
                                ? "bg-orange-500/20 text-orange-400"
                                : order.status === "delivered_to_customer"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {detailedStatusText}
                          </span>
                        </div>
                      )}

                      {showChefInfo && (
                        <div className="flex items-center gap-2 mt-2">
                          <ChefHat className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Oshpaz:</span>

                          <Button
                            variant="link"
                            className="p-0 h-auto text-white/70 hover:text-blue-200"
                            onClick={() => handleShowUserInfo(chefInfo, "chef")}
                          >
                            {chefInfo?.name || "Noma'lum"}
                          </Button>

                          {(() => {
                            // oshpaz status logikasi
                            if (order.status === "preparing")
                              return (
                                <span className="text-sm text-yellow-400">
                                  tayyorlanmoqda
                                </span>
                              );

                            if (order.status === "cancelled") {
                              if (!order.curier_id)
                                return (
                                  <span className="text-sm text-red-400">
                                    bekor qildi
                                  </span>
                                );
                              return (
                                <span className="text-sm text-white">
                                  tayyorladi
                                </span>
                              );
                            }

                            // boshqa barcha holatlar (ready, delivered, va hok.)
                            return (
                              <span className="text-sm text-white/50">
                                tayyorladi
                              </span>
                            );
                          })()}
                        </div>
                      )}

                      {showCourierInfo &&
                        !isPickup && ( // Faqat yetkazib berish bo'lsa kuryerni ko'rsatish
                          <div className="flex items-center gap-2 mt-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              Kuryer:
                            </span>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-white/70 hover:text-blue-200"
                              onClick={() =>
                                handleShowUserInfo(courierInfo, "curier")
                              }
                            >
                              {courierInfo?.name || "Noma'lum"}
                            </Button>
                            {order.status === "delivered_to_customer" && (
                              <span className="text-sm text-white/50">
                                mijozga yetkazdi
                              </span>
                            )}
                            {order.status === "cancelled" &&
                              order.curier_id && (
                                <span className="text-sm text-white/90">
                                  bekor qildi
                                </span>
                              )}{" "}
                          </div>
                        )}

                      {order.status === "cancelled" &&
                        order.cancellation_reason && (
                          <div className="flex items-center gap-2 mt-2">
                            <XCircle className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-400">
                              Sababi:
                            </span>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-red-300 hover:text-red-200"
                              onClick={() =>
                                handleShowCancellationReason(
                                  order.cancellation_reason
                                )
                              }
                            >
                              sababni ko'rish
                            </Button>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        description={infoModalDescription}
        details={infoModalDetails}
      />
      {/* <OrderItemsModal
        isOpen={showOrderItemsModal}
        onClose={() => setShowOrderItemsModal(false)}
        orderItems={currentOrderItems}
        orderId={currentOrderShortId}
      /> */}
    </div>
  );
};

export default AdminDashboard;
