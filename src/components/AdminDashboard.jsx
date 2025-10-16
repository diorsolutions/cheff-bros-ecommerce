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
  MapPin,
  Salad, // Yangi: Salad iconini import qilish
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
import { generateShortOrderId, cn, getMapLinks, formatQuantity } from "@/lib/utils"; // formatQuantity import qilindi
import InfoModal from "./InfoModal";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useMediaQuery } from "react-responsive";

// Umumiy tovush ijro etish funksiyasi
const playSound = (
  audioRef,
  setHasInteracted,
  hasInteracted,
  toastTitle,
  toastDescription
) => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => {
        setHasInteracted(true);
      })
      .catch((e) => {
        if (e.name === "NotAllowedError" && !hasInteracted) {
          toast({
            title: toastTitle,
            description: toastDescription,
            action: (
              <Button
                onClick={() => {
                  audioRef.current
                    .play()
                    .then(() => {
                      setHasInteracted(true);
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
            duration: 10000,
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

const AdminDashboard = ({ orders, onUpdateOrderStatus, curiers, chefs, ingredients }) => { // ingredients propini qabul qilish
  const [prevOrdersCount, setPrevOrdersCount] = useState(orders.length);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date-desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchBy, setSearchBy] = useState("id");

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState("");
  const [infoModalDescription, setInfoModalDescription] = useState("");
  const [infoModalDetails, setInfoModalDetails] = useState([]);

  const adminOrderSound = useRef(new Audio("/notification_admin_order.mp3"));
  const [hasInteracted, setHasInteracted] = useLocalStorage(
    "adminHasInteracted",
    false
  );

  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ minWidth: 769, maxWidth: 1024 });

  const playAdminOrderSound = () => {
    playSound(
      adminOrderSound,
      setHasInteracted,
      hasInteracted,
      "Admin tovushini yoqish kerak",
      "Yangi buyurtma tovushini eshitish uchun sahifa bilan o'zaro aloqada bo'ling."
    );
  };

  useEffect(() => {
    if (!hasInteracted) {
      playAdminOrderSound();
    }
  }, [hasInteracted]);

  useEffect(() => {
    const newOrders = orders.filter((order) => order.status === "new");
    const prevNewOrdersCount = prevOrdersCount;

    if (newOrders.length > prevNewOrdersCount) {
      playAdminOrderSound();
      toast({
        title: "🔔 Yangi buyurtma!",
        description: `${
          newOrders.length - prevNewOrdersCount
        } ta yangi buyurtma keldi`,
      });
    }
    setPrevOrdersCount(newOrders.length);
  }, [orders, hasInteracted]);

  const getCurierInfo = (curierId) => curiers.find((c) => c.id === curierId);
  const getChefInfo = (chefId) => chefs.find((c) => c.id === chefId);
  const getIngredientInfo = (ingredientId) => ingredients.find((i) => i.id === ingredientId); // Yangi: Masalliq ma'lumotini olish

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
    <span
      onClick={() => handleShowUserInfo(user, role)}
      className="inline underline cursor-pointer hover:text-blue-300 transition-colors"
    >
      {user?.name || "Noma'lum"}
    </span>
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

    if (status === "cancelled") {
      if (orderObject.curier_id && orderObject.cancellation_reason) {
        return (
          <>
            {chefInfo && (
              <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorladi! </>
            )}
            Kuryer: {renderUserLink(courierInfo, "curier")} bekor qildi
          </>
        );
      } else if (orderObject.chef_id && orderObject.cancellation_reason) {
        return <>Oshpaz: {renderUserLink(chefInfo, "chef")} bekor qildi</>;
      }
      return "Bekor qilingan";
    }

    if (isPickup) {
      switch (status) {
        case "new":
          return "Yangi (Olib ketish)";
        case "preparing":
          return <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorlanmoqda</>;
        case "ready":
          return (
            <>
              Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorladi (Olib
              ketishga tayyor)
            </>
          );
        case "delivered_to_customer":
          return (
            <>Oshpaz: {renderUserLink(chefInfo, "chef")} mijozga topshirdi</>
          );
        default:
          return "Noma'lum (Olib ketish)";
      }
    }

    if (curierId) {
      switch (status) {
        case "en_route_to_kitchen":
          return (
            <>
              Kuryer: {renderUserLink(courierInfo, "curier")} olish uchun yo'lda
            </>
          );
        case "picked_up_from_kitchen":
          return (
            <>Kuryer: {renderUserLink(courierInfo, "curier")} buyurtmani oldi</>
          );
        case "delivered_to_customer":
          return (
            <>
              Kuryer: {renderUserLink(courierInfo, "curier")} mijozga yetkazdi
            </>
          );
        default:
          return (
            <>
              Kuryer: {renderUserLink(courierInfo, "curier")} - olish uchun
              yo'lda
            </>
          );
      }
    }

    if (chefId) {
      switch (status) {
        case "preparing":
          return <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorlanmoqda</>;
        case "ready":
          return <>Oshpaz: {renderUserLink(chefInfo, "chef")} tayyorladi</>;
        default:
          return <>Oshpaz kutilmoqda</>;
      }
    }

    return status === "new" ? "Yangi" : "Noma'lum";
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
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex min-w-full justify-between xs:flex-row items-start xs:items-center gap-2 sm:gap-3 sm:w-auto">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
            Buyurtmalar
          </h1>
          <motion.div
            className={cn(
              "flex rounded-[1rem] items-center gap-2 px-3 py-1.5 border transition-all duration-300",
              newOrdersCount > 0
                ? "bg-gradient-to-r from-red-500 to-yellow-500 border-red-400 animate-newOrderPulse"
                : "bg-blue-500/20 border-blue-500/30"
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Bell
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5",
                newOrdersCount > 0 ? "text-white" : "text-blue-400"
              )}
            />
            <span
              className={cn(
                "font-medium whitespace-nowrap text-xs sm:text-sm lg:text-base",
                newOrdersCount > 0 ? "text-white" : "text-blue-400"
              )}
            >
              {newOrdersCount} ta yangi
            </span>
          </motion.div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between gap-3 w-full">
        {/* Left side filters */}
        <div className="flex xs:flex-row items-stretch xs:items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-2  xs:w-auto">
            <Filter className="h-4 w-4 text-gray-400 hidden sm:block flex-shrink-0" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full xs:w-[160px] sm:w-[180px] bg-white/10 border-white/20 text-white text-xs sm:text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-white/20">
                <SelectItem
                  value="all"
                  className="text-white text-xs sm:text-sm"
                >
                  Hammasi
                </SelectItem>
                <SelectItem
                  value="new"
                  className="text-blue-400 text-xs sm:text-sm"
                >
                  Yangi
                </SelectItem>
                <SelectItem
                  value="preparing"
                  className="text-yellow-400 text-xs sm:text-sm"
                >
                  Tayyorlanmoqda
                </SelectItem>
                <SelectItem
                  value="ready"
                  className="text-green-400 text-xs sm:text-sm"
                >
                  Tayyor
                </SelectItem>
                <SelectItem
                  value="en_route_to_kitchen"
                  className="text-yellow-400 text-xs sm:text-sm"
                >
                  Olish uchun yo'lda
                </SelectItem>
                <SelectItem
                  value="picked_up_from_kitchen"
                  className="text-orange-400 text-xs sm:text-sm"
                >
                  Buyurtma menda
                </SelectItem>
                <SelectItem
                  value="delivered_to_customer"
                  className="text-green-400 text-xs sm:text-sm"
                >
                  Mijozda
                </SelectItem>
                <SelectItem
                  value="cancelled"
                  className="text-red-400 text-xs sm:text-sm"
                >
                  Bekor qilingan
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full xs:w-[180px] sm:w-[200px] bg-white/10 border-white/20 text-white text-xs sm:text-sm">
              <SelectValue placeholder="Tartiblash" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem
                value="date-desc"
                className="text-white text-xs sm:text-sm"
              >
                Sana: Yangi → Eski
              </SelectItem>
              <SelectItem
                value="date-asc"
                className="text-white text-xs sm:text-sm"
              >
                Sana: Eski → Yangi
              </SelectItem>
              <SelectItem
                value="price-desc"
                className="text-white text-xs sm:text-sm"
              >
                Narx: Yuqori → Past
              </SelectItem>
              <SelectItem
                value="price-asc"
                className="text-white text-xs sm:text-sm"
              >
                Narx: Past → Yuqori
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side search */}
        <div className="flex xs:flex-row items-stretch xs:items-center gap-2 w-full lg:w-auto">
          <Select value={searchBy} onValueChange={setSearchBy}>
            <SelectTrigger className="w-full xs:w-[140px] sm:w-[150px] bg-white/10 border-white/20 text-white text-xs sm:text-sm">
              <SelectValue placeholder="Qidirish" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="id" className="text-white text-xs sm:text-sm">
                ID
              </SelectItem>
              <SelectItem
                value="customerName"
                className="text-white text-xs sm:text-sm"
              >
                Mijoz Ismi
              </SelectItem>
              <SelectItem
                value="customerPhone"
                className="text-white text-xs sm:text-sm"
              >
                Telefon
              </SelectItem>
              <SelectItem
                value="location"
                className="text-white text-xs sm:text-sm"
              >
                Manzil
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="w-full xs:flex-1 lg:w-[250px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-auto pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="grid gap-3 sm:gap-4">
        <AnimatePresence>
          {filteredOrders.length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-gray-400 text-sm sm:text-base lg:text-lg">
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

              const hideMainStatus = isFinal;
              const showChefInfo =
                order.chef_id &&
                (order.curier_id || isFinal || order.status === "ready");
              const showCourierInfo = order.curier_id && isFinal;
              const { yandexLink, googleLink, geoUri } = getMapLinks(
                order.coordinates?.lat,
                order.coordinates?.lng,
                order.location
              );
              const isPickup = order.delivery_option === "o_zim_olib_ketaman";

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card
                    className={cn(
                      "bg-gradient-to-br border-white/20 hover:border-white/30 transition-all duration-300",
                      order.status === "delivered_to_customer" &&
                        "from-green-500/10 to-green-500/5 border-green-500/30 opacity-80",
                      order.status === "cancelled" &&
                        "from-red-500/10 to-red-500/5 border-red-500/30 opacity-80",
                      order.status === "ready" &&
                        "from-green-500/10 to-green-500/5 border-green-500/30",
                      order.status === "picked_up_from_kitchen" &&
                        "from-orange-500/10 to-orange-500/5 border-orange-500/30",
                      (order.status === "en_route_to_kitchen" ||
                        order.status === "preparing") &&
                        "from-yellow-500/10 to-yellow-500/5 border-yellow-500/30",
                      ![
                        "delivered_to_customer",
                        "cancelled",
                        "ready",
                        "picked_up_from_kitchen",
                        "en_route_to_kitchen",
                        "preparing",
                      ].includes(order.status) && "from-white/10 to-white/5"
                    )}
                  >
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
                      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <CardTitle className="text-white flex items-center gap-2 text-sm sm:text-base lg:text-lg">
                          <span
                            className={cn(
                              "w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full",
                              getStatusColor(order.status),
                              [
                                "new",
                                "preparing",
                                "en_route_to_kitchen",
                                "picked_up_from_kitchen",
                              ].includes(order.status) && "animate-pulse"
                            )}
                          />
                          <span className="hidden xs:inline">Buyurtma</span>
                          <span className="text-gray-400 text-xs sm:text-sm">
                            ID: {generateShortOrderId(order.id)}
                          </span>
                        </CardTitle>

                        <div className="flex items-center gap-2 w-full xs:w-auto justify-between xs:justify-end">
                          <span className="text-gray-400 text-[10px] xs:text-xs sm:text-sm">
                            {(() => {
                              const date = new Date(order.created_at);
                              const day = date.getDate();
                              const hour = date
                                .getHours()
                                .toString()
                                .padStart(2, "0");
                              const minute = date
                                .getMinutes()
                                .toString()
                                .padStart(2, "0");
                              const monthNames = [
                                "yan",
                                "fev",
                                "mart",
                                "apr",
                                "may",
                                "iyun",
                                "iyul",
                                "avg",
                                "sen",
                                "okt",
                                "noy",
                                "dek",
                              ];
                              const month = monthNames[date.getMonth()];
                              return isMobile
                                ? `${day}-${month}, ${hour}:${minute}`
                                : `${day}-${month}, soat: ${hour}:${minute}`;
                            })()}
                          </span>

                          {!order.curier_id && !order.chef_id && !isFinal ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-white/20 h-7 w-7 p-0"
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
                                      className="text-yellow-400 hover:!bg-yellow-500/20 focus:bg-yellow-500/20 text-xs sm:text-sm"
                                    >
                                      <Utensils className="mr-2 h-4 w-4" />
                                      Tayyorlanmoqda
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
                                      className="text-yellow-400 hover:!bg-yellow-500/20 focus:bg-yellow-500/20 text-xs sm:text-sm"
                                    >
                                      <Truck className="mr-2 h-4 w-4" />
                                      Olish uchun yo'lda
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
                                      className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 text-xs sm:text-sm"
                                    >
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Tayyor
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
                                      className="text-orange-400 hover:!bg-orange-500/20 focus:bg-orange-500/20 text-xs sm:text-sm"
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      Buyurtma menda
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
                                        className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 text-xs sm:text-sm"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mijozda
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
                                        className="text-red-400 hover:!bg-red-500/20 focus:bg-red-500/20 text-xs sm:text-sm"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Bekor qilish
                                      </DropdownMenuItem>
                                    </>
                                  )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-[10px] xs:text-xs text-gray-400 italic">
                              {isFinal
                                ? order.status === "delivered_to_customer"
                                  ? "✓ Yetkazildi"
                                  : "✗ Bekor"
                                : "Biriktirilgan"}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
                      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                        {/* Customer Info */}
                        <div>
                          <h4 className="font-medium text-white mb-2 text-sm sm:text-base">
                            Mijoz ma'lumotlari
                          </h4>
                          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-300">
                            <p className="flex flex-wrap items-center gap-1">
                              <span className="font-bold text-gray-100/50">
                                Ism:
                              </span>
                              <span className="break-all">
                                {order.customer_info.name}
                              </span>
                            </p>
                            <p className="flex flex-wrap items-center gap-1">
                              <span className="font-bold text-gray-100/50">
                                Tel:
                              </span>
                              <span>{order.customer_info.phone}</span>
                            </p>
                            <p className="flex flex-wrap items-center gap-1">
                              <span className="font-bold text-gray-100/50">
                                Usuli:
                              </span>
                              <span className="font-medium text-white">
                                {order.delivery_option === "o_zim_olib_ketaman"
                                  ? "O'zim olib ketaman"
                                  : "Yetkazib berilsin"}
                              </span>
                            </p>
                            {!isPickup && (
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-gray-100/50">
                                  Manzil:
                                </span>
                                {order.location && (
                                  <span className="break-words text-xs sm:text-sm">
                                    {order.location}
                                  </span>
                                )}
                                {order.coordinates && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="link"
                                        className="p-0 h-auto text-blue-300 hover:text-blue-200 text-xs sm:text-sm justify-start"
                                      >
                                        <MapPin className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                                        Xaritada ochish
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-slate-800 border-white/20">
                                      {yandexLink && (
                                        <DropdownMenuItem asChild>
                                          <a
                                            href={yandexLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white hover:!bg-white/20 focus:bg-white/20 text-xs sm:text-sm"
                                          >
                                            Yandex Maps
                                          </a>
                                        </DropdownMenuItem>
                                      )}
                                      {googleLink && (
                                        <DropdownMenuItem asChild>
                                          <a
                                            href={googleLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white hover:!bg-white/20 focus:bg-white/20 text-xs sm:text-sm"
                                          >
                                            Google Maps
                                          </a>
                                        </DropdownMenuItem>
                                      )}
                                      {geoUri && (
                                        <DropdownMenuItem asChild>
                                          <a
                                            href={geoUri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-white hover:!bg-white/20 focus:bg-white/20 text-xs sm:text-sm"
                                          >
                                            Boshqa ilova
                                          </a>
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Details */}
                        <div>
                          <h4 className="font-medium text-white mb-2 text-sm sm:text-base">
                            Buyurtma tafsilotlari
                          </h4>
                          <div className="space-y-1 sm:space-y-1.5">
                            {order.items.map((item, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-start gap-2 text-xs sm:text-sm"
                              >
                                <span className="text-gray-300 flex-1 break-words">
                                  {item.name}{" "}
                                  <span className="text-gray-400">
                                    x{item.quantity}
                                  </span>
                                </span>
                                <span className="text-white/80 font-medium whitespace-nowrap">
                                  {(
                                    item.price * item.quantity
                                  ).toLocaleString()}{" "}
                                  so'm
                                </span>
                                {item.customizations && Object.keys(item.customizations).length > 0 && (
                                  <div className="mt-1 text-xs text-gray-400 w-full">
                                    <p className="font-semibold flex items-center gap-1">
                                      <Salad className="h-3 w-3" /> Moslashtirishlar:
                                    </p>
                                    <ul className="list-disc list-inside ml-4">
                                      {Object.entries(item.customizations).map(([ingId, qty]) => {
                                        const ingredient = getIngredientInfo(ingId); // Masalliq ma'lumotini olish
                                        return (
                                          <li key={ingId}>
                                            {ingredient?.name || `Noma'lum masalliq`}: {formatQuantity(qty, ingredient?.unit || 'dona')} {ingredient?.unit || 'dona'}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="border-t border-white/20 pt-2 mt-2">
                              <div className="flex justify-between items-center font-bold">
                                <span className="text-white text-sm sm:text-base">
                                  Jami:
                                </span>
                                <span className="text-white text-base sm:text-lg">
                                  {order.total_price.toLocaleString()} so'm
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status */}
                      {!hideMainStatus && (
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-400">Status:</span>
                          <span
                            className={cn(
                              "font-medium px-2 py-1 rounded inline-flex items-center gap-1",
                              order.status === "new" &&
                                "bg-blue-500/20 text-blue-400",
                              order.status === "preparing" &&
                                "bg-yellow-500/20 text-yellow-400",
                              order.status === "ready" &&
                                "bg-green-500/20 text-green-400",
                              order.status === "en_route_to_kitchen" &&
                                "bg-yellow-500/20 text-yellow-400",
                              order.status === "picked_up_from_kitchen" &&
                                "bg-orange-500/20 text-orange-400",
                              order.status === "delivered_to_customer" &&
                                "bg-green-500/20 text-green-400",
                              order.status === "cancelled" &&
                                "bg-red-500/20 text-red-400"
                            )}
                          >
                            {detailedStatusText}
                          </span>
                        </div>
                      )}

                      {/* Chef Info */}
                      {showChefInfo && (
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-400">Oshpaz:</span>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-300 hover:text-blue-200 text-xs sm:text-sm"
                            onClick={() => handleShowUserInfo(chefInfo, "chef")}
                          >
                            {chefInfo?.name || "Noma'lum"}
                          </Button>
                          {(() => {
                            if (order.status === "preparing")
                              return (
                                <span className="text-yellow-400">
                                  tayyorlanmoqda
                                </span>
                              );
                            if (order.status === "cancelled") {
                              if (!order.curier_id)
                                return (
                                  <span className="text-red-400">
                                    bekor qildi
                                  </span>
                                );
                              return (
                                <span className="text-green-400">
                                  tayyorladi
                                </span>
                              );
                            }
                            return (
                              <span className="text-green-400">tayyorladi</span>
                            );
                          })()}
                        </div>
                      )}

                      {/* Courier Info */}
                      {showCourierInfo && !isPickup && (
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                          <Truck className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-400">Kuryer:</span>
                          <Button
                            variant="link"
                            className="p-0 h-auto text-blue-300 hover:text-blue-200 text-xs sm:text-sm"
                            onClick={() =>
                              handleShowUserInfo(courierInfo, "curier")
                            }
                          >
                            {courierInfo?.name || "Noma'lum"}
                          </Button>
                          {order.status === "delivered_to_customer" && (
                            <span className="text-green-400">
                              mijozga yetkazdi
                            </span>
                          )}
                          {order.status === "cancelled" && order.curier_id && (
                            <span className="text-red-400">bekor qildi</span>
                          )}
                        </div>
                      )}

                      {/* Cancellation Reason */}
                      {order.status === "cancelled" &&
                        order.cancellation_reason && (
                          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0" />
                            <span className="text-red-400">Sababi:</span>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-red-300 hover:text-red-200 text-xs sm:text-sm"
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

      {/* Info Modal */}
      <InfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={infoModalTitle}
        description={infoModalDescription}
        details={infoModalDetails}
      />
    </div>
  );
};

export default AdminDashboard;