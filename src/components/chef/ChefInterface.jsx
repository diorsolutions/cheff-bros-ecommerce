import React, { useState, useEffect, useMemo, useRef } from "react"; // useRef import qilindi
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Utensils,
  LogOut,
  User,
  Clock,
  ChefHat,
  Search,
  Truck, // Kuryer statusini ko'rsatish uchun
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import ChefSettingsDialog from "./ChefSettingsDialog";
import { generateShortOrderId } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const ChefInterface = ({ orders, onUpdateOrderStatus, chefs, curiers }) => {
  const navigate = useNavigate();
  const [chefName, setChefName] = useState("Oshpaz");
  const [chefPhone, setChefPhone] = useState("");
  const [chefId, setChefId] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentOrderToCancel, setCurrentOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const chefOrderSound = useRef(new Audio("/notification_chef_sound.mp3"));
  const prevSortedOrdersRef = useRef([]); // To store previous sorted orders for comparison

  useEffect(() => {
    const fetchChefInfo = async () => {
      const storedUsername = localStorage.getItem("chefUsername");
      const storedId = localStorage.getItem("chefId");

      if (storedUsername && storedId) {
        setChefId(storedId);
        const { data, error } = await supabase
          .from("chefs")
          .select("name, phone")
          .eq("id", storedId)
          .single();

        if (error) {
          console.error("Oshpaz ma'lumotlarini yuklashda xatolik:", error);
          toast({
            title: "Xatolik",
            description: "Oshpaz ma'lumotlarini yuklashda xatolik yuz berdi.",
            variant: "destructive",
          });
          handleLogout();
        } else if (data) {
          setChefName(data.name || storedUsername);
          setChefPhone(data.phone || "");
        }
      } else {
        handleLogout();
      }
    };
    fetchChefInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("chefLoggedIn");
    localStorage.removeItem("chefUsername");
    localStorage.removeItem("chefId");
    navigate("/chef-login", { replace: true });
    toast({
      title: "Chiqish",
      description: "Tizimdan muvaffaqiyatli chiqdingiz.",
    });
  };

  const handleNameUpdated = (newName, newPhone) => {
    setChefName(newName);
    setChefPhone(newPhone);
  };

  const getChefInfo = (id) => {
    return chefs.find((c) => c.id === id);
  };

  const getCurierInfo = (id) => {
    return curiers.find((c) => c.id === id);
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

  const getStatusText = (status, orderChefId, orderCurierId) => {
    const assignedChefName = orderChefId
      ? getChefInfo(orderChefId)?.name
      : null;
    const assignedCurierName = orderCurierId
      ? getCurierInfo(orderCurierId)?.name
      : null;

    let statusText = "";

    if (status === "cancelled") {
      statusText = "Bekor qilingan";
    } else if (orderCurierId) {
      // Kuryerga biriktirilgan bo'lsa, kuryer statusini ko'rsatish
      switch (status) {
        case "en_route_to_kitchen":
          statusText = assignedCurierName
            ? `${assignedCurierName} olish uchun yo'lda`
            : "Kuryer olish uchun yo'lda";
          break;
        case "picked_up_from_kitchen":
          statusText = assignedCurierName
            ? `${assignedCurierName} buyurtmani oldi`
            : "Kuryer buyurtmani oldi";
          break;
        case "delivered_to_customer":
          statusText = assignedCurierName
            ? `${assignedCurierName} mijozga yetkazdi`
            : "Mijozga yetkazildi";
          break;
        default:
          statusText = assignedCurierName
            ? `${assignedCurierName} buyurtmani boshqarmoqda`
            : "Kuryer boshqarmoqda";
          break;
      }
    } else if (orderChefId) {
      // Oshpazga biriktirilgan bo'lsa, oshpaz statusini ko'rsatish
      switch (status) {
        case "preparing":
          statusText = assignedChefName
            ? `${assignedChefName} tayyorlanmoqda`
            : "Tayyorlanmoqda";
          break;
        case "ready":
          statusText = assignedChefName
            ? `${assignedChefName} tayyorladi`
            : "Tayyor";
          break;
        default:
          statusText = assignedChefName
            ? `${assignedChefName} buyurtmani boshqarmoqda`
            : "Oshpaz boshqarmoqda";
          break;
      }
    } else {
      // Hech kimga biriktirilmagan buyurtmalar
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

  const formatOrderDateTime = (timestamp) => {
    const orderDate = new Date(timestamp);
    const formattedDate = orderDate.toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const formattedTime = orderDate.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return `kun: ${formattedDate}, soat: ${formattedTime}`;
  };

  const sortedOrders = useMemo(() => {
    if (!orders || !chefId) return [];

    let filtered = orders.filter((order) => {
      // Kuryer tomonidan yetkazilgan yoki bekor qilingan buyurtmalarni butunlay yashirish
      if (
        order.status === "delivered_to_customer" ||
        order.status === "cancelled"
      ) {
        return false;
      }

      // Oshpazga biriktirilgan buyurtmalar yoki hech kimga biriktirilmagan 'new' buyurtmalar ko'rinadi.
      return (
        order.chef_id === chefId || (!order.chef_id && order.status === "new")
      );
    });

    // Qidiruv filtri
    if (searchTerm.trim()) {
      const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((order) =>
        generateShortOrderId(order.id).includes(lowerCaseSearchTerm)
      );
    }

    // Saralash: "preparing" statusidagi buyurtmalar eng tepada, keyin "new", keyin "ready", keyin qolganlari.
    // Har bir status ichida yaratilish sanasi bo'yicha saralash (eng eskisi birinchi).
    return filtered.sort((a, b) => {
      const statusOrder = {
        preparing: 1, // "Tayyorlanmoqda" eng yuqorida
        new: 2,
        ready: 3,
        en_route_to_kitchen: 4,
        picked_up_from_kitchen: 5,
        delivered_to_customer: 6,
        cancelled: 7,
      };
      const statusA = statusOrder[a.status] || 99;
      const statusB = statusOrder[b.status] || 99;

      if (statusA !== statusB) {
        return statusA - statusB;
      }
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ); // Oldest first
    });
  }, [orders, searchTerm, chefId]);

  useEffect(() => {
    const prevOrders = prevSortedOrdersRef.current;

    sortedOrders.forEach((currentOrder) => {
      const prevOrder = prevOrders.find((o) => o.id === currentOrder.id);

      // Condition: New unassigned 'new' order appears
      const isNewAvailableOrder =
        !prevOrder && !currentOrder.chef_id && currentOrder.status === "new";

      if (isNewAvailableOrder) {
        chefOrderSound.current
          .play()
          .catch((e) => console.error("Error playing chef order sound:", e));
      }
    });

    // Update ref for next render
    prevSortedOrdersRef.current = sortedOrders;
  }, [sortedOrders, chefId]);

  const handleCancelClick = (order) => {
    setCurrentOrderToCancel(order);
    setCancellationReason("");
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Xatolik",
        description: "Bekor qilish sababini kiritish majburiy.",
        variant: "destructive",
      });
      return;
    }
    if (currentOrderToCancel) {
      await onUpdateOrderStatus(
        currentOrderToCancel.id,
        "cancelled",
        chefId,
        "chef",
        cancellationReason.trim()
      );
    }
    setShowCancelDialog(false);
    setCurrentOrderToCancel(null);
    setCancellationReason("");
  };

  return (
    <div className="min-h-screen bg-[#fefefe] text-gray-800">
      <header className="bg-white border-b border-gray-300 sticky top-0 z-30">
        <div className="mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl nor_tablet:text-xl mob:text-lg font-bold text-gray-800">
              Oshpaz Paneli
            </h1>
          </div>
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => setShowSettingsDialog(true)}
              className="text-gray-800 hover:bg-gray-300 bg-gray-200 rounded-[0.3rem] gap-2 p-2 sm:p-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{chefName}</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-gray-800 hover:bg-gray-300 bg-gray-200 rounded-[0.3rem] gap-2 p-2 sm:p-3"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Chiqish</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="p-4 sm:p-6 bg-[#f6f6f6]">
        {/* Qidiruv maydoni */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="number"
              placeholder="Buyurtma ID bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 bg-white border-gray-300 text-gray-800 placeholder:text-gray-500"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <AnimatePresence>
            {sortedOrders.length === 0 ? (
              <Card className="bg-white/40 border-gray-100">
                <CardContent className="p-8 text-center ">
                  <p className="text-gray-600 text-lg">
                    Hozircha buyurtmalar yo'q.
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedOrders.map((order) => {
                const isNew = order.status === "new";
                const isPreparing = order.status === "preparing";
                const isReady = order.status === "ready";
                const isEnRouteToKitchen =
                  order.curier_id && order.status === "en_route_to_kitchen"; // Kuryer biriktirilgan va yo'lda
                const isPickedUpFromKitchen =
                  order.curier_id && order.status === "picked_up_from_kitchen"; // Kuryer biriktirilgan va olib ketgan
                const isDelivered = order.status === "delivered_to_customer";
                const isCancelled = order.status === "cancelled";

                const isAssignedToThisChef = order.chef_id === chefId;
                const isUnassignedNewOrder = !order.chef_id && isNew;

                // Tugmalar uchun harakatlarni o'chirish logikasi
                const canMarkPreparing =
                  (isNew && !order.chef_id) || (isNew && isAssignedToThisChef);
                const canMarkReady = isPreparing && isAssignedToThisChef;
                // Bekor qilish tugmasi faqat buyurtma kuryer tomonidan olinmagan bo'lsa ko'rinadi
                const canCancel =
                  (isNew || isPreparing || isReady || isEnRouteToKitchen) &&
                  !isPickedUpFromKitchen &&
                  !isDelivered &&
                  !isCancelled &&
                  isAssignedToThisChef;

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Card
                      className={`bg-white border-gray-300 shadow-[0_5px_15px_0_rgba(0,0,0,0.15)] transition-all duration-300 ${
                        isDelivered ? "opacity-60" : "" // Yetkazilgan bo'lganda xiralashadi
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-gray-800 flex items-center gap-3 text-base sm:text-lg">
                            <span
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                order.status
                              )} ${
                                !isReady && !isCancelled && !isDelivered
                                  ? "animate-pulse"
                                  : ""
                              }`}
                            ></span>
                            <span className="text-sm sm:text-base">
                              Buyurtma{" "}
                            </span>
                            <span className="text-gray-500 text-xs sm:text-sm">
                              {generateShortOrderId(order.id)}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-xs sm:text-sm">
                              {formatOrderDateTime(order.created_at)}
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <p className="flex items-center text-sm">
                            <span className="font-bold text-gray-800">
                              Mijoz:
                            </span>{" "}
                            {order.customer_info.name}
                          </p>
                          <p className="text-sm">
                            <span className="font-bold text-gray-800">
                              Tel:
                            </span>{" "}
                            <a
                              href={`tel:${order.customer_info.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {order.customer_info.phone}
                            </a>
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-bold text-gray-800">
                            Manzil:
                          </span>{" "}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${order.location}`}
                            className="text-blue-600 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Ochish
                          </a>
                        </p>

                        <div className="border-t border-gray-300 pt-2 mt-2">
                          <h4 className="font-medium text-gray-800 mb-2 text-base">
                            Buyurtma tafsilotlari
                          </h4>
                          <div className="space-y-1">
                            {order.items.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="flex justify-between text-sm text-gray-600"
                              >
                                <span>
                                  {item.name} x{item.quantity}
                                </span>
                                <span className="font-medium text-orange-500">
                                  {(
                                    item.price * item.quantity
                                  ).toLocaleString()}{" "}
                                  so'm
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between items-center">
                          <span className="text-gray-800 font-bold text-base">
                            Jami:
                          </span>{" "}
                          <span className="text-orange-500 text-lg font-bold">
                            {order.total_price.toLocaleString()} so'm
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-4 w-4 text-gray-500" />{" "}
                          <span className="text-sm text-gray-500">Status:</span>{" "}
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              isNew
                                ? "bg-blue-100 text-blue-600"
                                : isPreparing
                                ? "bg-yellow-100 text-yellow-600"
                                : isReady
                                ? "bg-green-100 text-green-600"
                                : order.curier_id &&
                                  order.status === "en_route_to_kitchen"
                                ? "bg-yellow-100 text-yellow-600" // Kuryerga biriktirilgan va yo'lda
                                : order.curier_id &&
                                  order.status === "picked_up_from_kitchen"
                                ? "bg-orange-100 text-orange-600" // Kuryerga biriktirilgan va olib ketgan
                                : isDelivered
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {getStatusText(
                              order.status,
                              order.chef_id,
                              order.curier_id
                            )}
                          </span>
                        </div>

                        {order.chef_id && (
                          <div className="flex items-center gap-2 mt-2">
                            <ChefHat className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">
                              Oshpaz:
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {getChefInfo(order.chef_id)?.name || "Noma'lum"}
                            </span>
                          </div>
                        )}
                        {order.curier_id && (
                          <div className="flex items-center gap-2 mt-2">
                            <Truck className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">
                              Kuryer:
                            </span>
                            <span className="text-sm font-medium text-gray-800">
                              {getCurierInfo(order.curier_id)?.name ||
                                "Noma'lum"}
                            </span>
                          </div>
                        )}

                        {/* Harakat tugmalari */}
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {canMarkPreparing && (
                            <Button
                              onClick={() =>
                                onUpdateOrderStatus(
                                  order.id,
                                  "preparing",
                                  chefId,
                                  "chef"
                                )
                              }
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                            >
                              <Utensils className="mr-2 h-4 w-4" />
                              Tayyorlanmoqda
                            </Button>
                          )}
                          {canMarkReady && (
                            <Button
                              onClick={() =>
                                onUpdateOrderStatus(
                                  order.id,
                                  "ready",
                                  chefId,
                                  "chef"
                                )
                              }
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Tayyor
                            </Button>
                          )}
                          {canCancel && (
                            <Button
                              onClick={() => handleCancelClick(order)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Bekor qilish
                            </Button>
                          )}
                        </div>
                        {isCancelled && order.cancellation_reason && (
                          <p className="text-sm text-red-600 italic mt-4 text-center">
                            Bekor qilingan. Sababi: {order.cancellation_reason}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </main>
      {chefId && (
        <ChefSettingsDialog
          isOpen={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          chefId={chefId}
          currentName={chefName}
          currentPhone={chefPhone}
          onNameUpdated={handleNameUpdated}
          orders={orders}
        />
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white border-gray-300">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">
              Buyurtmani bekor qilish
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Buyurtmani bekor qilish sababini kiriting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Bekor qilish sababi..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="col-span-3 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500 min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowCancelDialog(false);
                setCurrentOrderToCancel(null);
                setCancellationReason("");
              }}
              className="text-gray-800 border-gray-300 hover:bg-gray-200"
            >
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Tasdiqlash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChefInterface;