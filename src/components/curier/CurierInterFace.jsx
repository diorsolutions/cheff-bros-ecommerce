import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Truck,
  LogOut,
  User,
  Package,
  ChefHat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import CurierSettingsDialog from "./CurierSettingsDialog";
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
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Umumiy tovush ijro etish funksiyasi
const playSound = (audioRef, setHasInteracted, hasInteracted, toastTitle, toastDescription) => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0; // Tovushni boshidan boshlash
    audioRef.current.play().then(() => {
      setHasInteracted(true); // Muvaffaqiyatli ijro etildi, foydalanuvchi o'zaro aloqada bo'ldi
    }).catch(e => {
      if (e.name === "NotAllowedError" && !hasInteracted) {
        // Faqat NotAllowedError bo'lsa va hali ko'rsatilmagan bo'lsa toast ko'rsatish
        toast({
          title: toastTitle,
          description: toastDescription,
          action: (
            <Button
              onClick={() => {
                audioRef.current.play().then(() => {
                  setHasInteracted(true); // Foydalanuvchi tugmani bosdi, o'zaro aloqa bo'ldi
                  toast({
                    title: "Tovush yoqildi!",
                    description: "Bildirishnoma tovushlari endi ijro etiladi.",
                  });
                }).catch(err => console.error("Manual play failed:", err));
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
          description: "Tovush fayli ijro etib bo'lmaydi. Iltimos, faylni tekshiring.",
          variant: "destructive",
        });
      } else {
        console.error("Error playing sound:", e);
      }
    });
  }
};

const CurierInterFace = ({ orders, onUpdateOrderStatus, chefs, curiers }) => {
  const navigate = useNavigate();
  const [curierName, setCurierName] = useState("Kuryer");
  const [curierPhone, setCurierPhone] = useState("");
  const [curierId, setCurierId] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [currentOrderToCancel, setCurrentOrderToCancel] = useState(null);
  const [cancellationReason, setCancellationReason] = useState("");

  const curierOrderSound = useRef(new Audio("/notification_curier_order.mp3"));
  const prevSortedOrdersRef = useRef([]);
  const [hasInteracted, setHasInteracted] = useLocalStorage("curierHasInteracted", false);

  useEffect(() => {
    const fetchCurierInfo = async () => {
      const storedUsername = localStorage.getItem("curierUsername");
      const storedId = localStorage.getItem("curierId");

      if (storedUsername && storedId) {
        setCurierId(storedId);
        const { data, error } = await supabase
          .from("curiers")
          .select("name, phone")
          .eq("id", storedId)
          .single();

        if (error) {
          console.error("Kuryer ma'lumotlarini yuklashda xatolik:", error);
          toast({
            title: "Xatolik",
            description: "Kuryer ma'lumotlarini yuklashda xatolik yuz berdi.",
            variant: "destructive",
          });
          handleLogout();
        } else if (data) {
          setCurierName(data.name || storedUsername);
          setCurierPhone(data.phone || "");
        }
      } else {
        handleLogout();
      }
    };
    fetchCurierInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("curierLoggedIn");
    localStorage.removeItem("curierUsername");
    localStorage.removeItem("curierId");
    navigate("/curier-login", { replace: true });
    toast({
      title: "Chiqish",
      description: "Tizimdan muvaffaqiyatli chiqdingiz.",
    });
  };

  const handleNameUpdated = (newName, newPhone) => {
    setCurierName(newName);
    setCurierPhone(newPhone);
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
    const assignedChefName = orderChefId ? getChefInfo(orderChefId)?.name : null;
    const assignedCurierName = orderCurierId ? getCurierInfo(orderCurierId)?.name : null;

    let statusText = "";

    if (status === "cancelled") {
      statusText = "Bekor qilingan";
    } else if (orderCurierId) {
      switch (status) {
        case "en_route_to_kitchen":
          statusText = assignedCurierName ? `${assignedCurierName} olish uchun yo'lda` : "Olish uchun yo'lda";
          break;
        case "picked_up_from_kitchen":
          statusText = assignedCurierName ? `${assignedCurierName} buyurtmani oldi` : "Buyurtma menda";
          break;
        case "delivered_to_customer":
          statusText = assignedCurierName ? `${assignedCurierName} mijozga yetkazdi` : "Mijozda";
          break;
        default:
          if (status === "preparing") {
            statusText = assignedChefName ? `${assignedChefName} tayyorlanmoqda` : "Tayyorlanmoqda";
          } else if (status === "ready") {
            statusText = assignedChefName ? `${assignedChefName} tayyorladi` : "Tayyor";
          } else {
            statusText = assignedCurierName ? `${assignedCurierName} buyurtmani boshqarmoqda` : "Kuryer boshqarmoqda";
          }
          break;
      }
    } else if (orderChefId) {
      switch (status) {
        case "preparing":
          statusText = assignedChefName ? `${assignedChefName} tayyorlanmoqda` : "Tayyorlanmoqda";
          break;
        case "ready":
          statusText = assignedChefName ? `${assignedChefName} tayyorladi` : "Tayyor";
          break;
        default:
          statusText = assignedChefName ? `${assignedChefName} buyurtmani boshqarmoqda` : "Oshpaz boshqarmoqda";
          break;
      }
    } else {
      switch (status) {
        case "new":
          statusText = "Yangi";
          break;
        case "ready":
          statusText = "Tayyor";
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
      day: "numeric",
      month: "long", // "2-digit" dan "long" ga o'zgartirildi
      year: "numeric",
    });
    const formattedTime = orderDate.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
      // second: "2-digit", // Sekundlar olib tashlandi
      hour12: false,
    });
    return `${formattedDate}, soat: ${formattedTime}`; // "kun:" olib tashlandi, format o'zgartirildi
  };

  const sortedOrders = useMemo(() => {
    if (!curierId || !orders) return [];

    const relevantOrders = orders.filter(order => {
      if (order.status === "cancelled" && order.chef_id) {
        return false;
      }
      if (order.status === "delivered_to_customer") {
        return false;
      }

      if (order.curier_id === curierId) {
        return true;
      }
      if (!order.curier_id && (order.status === "preparing" || order.status === "ready")) {
        return true;
      }

      if (order.curier_id && order.curier_id !== curierId) {
          return false;
      }

      return false;
    });

    return relevantOrders.sort((a, b) => {
      const statusOrder = { "ready": 1, "preparing": 2, "en_route_to_kitchen": 3, "picked_up_from_kitchen": 4, "delivered_to_customer": 5, "cancelled": 6 };

      const aIsAvailable = !a.curier_id && (a.status === "preparing" || a.status === "ready");
      const bIsAvailable = !b.curier_id && (b.status === "preparing" || b.status === "ready");

      if (aIsAvailable && !bIsAvailable) return -1;
      if (!aIsAvailable && bIsAvailable) return 1;

      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }

      if (a.status === "ready" || a.status === "preparing" || a.status === "en_route_to_kitchen") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [orders, curierId]);

  const playCurierOrderSound = () => {
    playSound(
      curierOrderSound,
      setHasInteracted,
      hasInteracted,
      "Kuryer tovushini yoqish kerak",
      "Yangi buyurtma tovushini eshitish uchun sahifa bilan o'zaro aloqada bo'ling (masalan, tugmani bosing)."
    );
  };

  // Komponent yuklanganda tovushni proaktiv yoqishga urinish
  useEffect(() => {
    if (!hasInteracted) {
      playCurierOrderSound();
    }
  }, [hasInteracted]);

  useEffect(() => {
    const prevOrdersMap = new Map(prevSortedOrdersRef.current.map(o => [o.id, o]));

    sortedOrders.forEach(currentOrder => {
      const prevOrder = prevOrdersMap.get(currentOrder.id);

      // Tovush ijro etish shartini yangilash:
      // Buyurtma "preparing" yoki "ready" statusiga o'tgan bo'lsa,
      // va kuryerga biriktirilmagan bo'lsa,
      // va oldingi holatda bu buyurtma "preparing" yoki "ready" statusida bo'lmagan bo'lsa (yoki kuryerga biriktirilgan bo'lsa).
      const isNewlyAvailableForCourier =
        (currentOrder.status === "preparing" || currentOrder.status === "ready") &&
        !currentOrder.curier_id &&
        (!prevOrder || !(prevOrder.status === "preparing" || prevOrder.status === "ready") || prevOrder.curier_id);

      if (isNewlyAvailableForCourier) {
        console.log(`[Courier Sound] Playing sound for order ID: ${generateShortOrderId(currentOrder.id)} (Status: ${currentOrder.status}, Curier ID: ${currentOrder.curier_id})`);
        playCurierOrderSound();
      }
    });

    prevSortedOrdersRef.current = sortedOrders;
  }, [sortedOrders, curierId]); // hasInteracted dependency'dan olib tashlandi

  const activeOrdersCount = sortedOrders.filter(
    (order) =>
      order.curier_id === curierId &&
      (order.status === "en_route_to_kitchen" ||
        order.status === "picked_up_from_kitchen")
  ).length;

  const canTakeNewOrder = activeOrdersCount < 2;

  const isPickupButtonDisabled = (order) => {
    return !canTakeNewOrder || order.curier_id !== null;
  };

  const isPickedUpButtonDisabled = (order) => {
    return order.curier_id === curierId && order.status !== "ready";
  };

  const getPickedUpButtonText = (order) => {
    if (isPickedUpButtonDisabled(order)) {
      const chef = getChefInfo(order.chef_id);
      return `${chef?.name || "Oshpaz"} tayyorlamoqda`;
    }
    return "Buyurtma menda";
  };

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
        curierId,
        "curier",
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
            <Truck className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl nor_tablet:text-xl mob:text-lg font-bold text-gray-800">
              Buyurtmalar Paneli
            </h1>
          </div>
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => setShowSettingsDialog(true)}
              className="text-gray-800 hover:bg-gray-300 bg-gray-200 rounded-[0.3rem] gap-2 p-2 sm:p-3"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{curierName}</span>
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
        <div className="grid gap-4">
          <AnimatePresence>
            {sortedOrders.length === 0 ? (
              <Card className="bg-white/40 border-gray-100">
                <CardContent className="p-8 text-center ">
                  <p className="text-gray-600 text-lg">
                    Hozircha yetkazib beriladigan buyurtmalar yo'q.
                  </p>
                </CardContent>
              </Card>
            ) : (
              sortedOrders.map((order) => {
                const isNew = order.status === "new";
                const isPreparing = order.status === "preparing";
                const isReady = order.status === "ready";
                const isEnRouteToKitchen =
                  order.status === "en_route_to_kitchen";
                const isPickedUpFromKitchen =
                  order.status === "picked_up_from_kitchen";
                const isFinal =
                  order.status === "delivered_to_customer" ||
                  order.status === "cancelled";

                const isAssignedToThisCourier = order.curier_id === curierId;
                const isUnassignedAndPreparingOrReady = !order.curier_id && (isPreparing || isReady);


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
                        isUnassignedAndPreparingOrReady && isPickupButtonDisabled(order)
                          ? "opacity-50 pointer-events-none"
                          : ""
                      } ${
                        order.status === "delivered_to_customer"
                          ? "bg-green-100 border-green-300 opacity-80"
                          : order.status === "cancelled"
                          ? "bg-red-100 border-red-300 opacity-80"
                          : order.status === "picked_up_from_kitchen"
                          ? "bg-orange-100 border-orange-300"
                          : order.status === "en_route_to_kitchen"
                          ? "bg-yellow-100 border-yellow-300"
                          : order.status === "ready"
                          ? "bg-green-50/50 border-green-100"
                          : isPreparing
                          ? "bg-yellow-50/50 border-yellow-100"
                          : "bg-white"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-gray-800 flex items-center gap-3 text-base sm:text-lg">
                            <span
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                order.status
                              )} ${!isFinal ? "animate-pulse" : ""}`}
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
                          {order.coordinates ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`}
                              className="text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Xaritada ochish
                            </a>
                          ) : (
                            order.location
                          )}
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
                                  {(item.price * item.quantity).toLocaleString()} so'm
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
                          <Truck className="h-4 w-4 text-gray-500" />{" "}
                          <span className="text-sm text-gray-500">
                            Status:
                          </span>{" "}
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              order.status === "new"
                                ? "bg-blue-100 text-blue-600"
                                : order.status === "preparing"
                                ? "bg-yellow-100 text-yellow-600"
                                : order.status === "ready"
                                ? "bg-green-100 text-green-600"
                                : order.status === "en_route_to_kitchen"
                                ? "bg-yellow-100 text-yellow-600"
                                : order.status === "picked_up_from_kitchen"
                                ? "bg-orange-100 text-orange-600"
                                : order.status === "delivered_to_customer"
                                ? "bg-green-100 text-green-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {getStatusText(order.status, order.chef_id, order.curier_id)}
                          </span>
                        </div>

                        {order.chef_id && (
                          <div className="flex items-center gap-2 mt-2">
                            <ChefHat className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-500">Oshpaz:</span>
                            <span className="text-sm font-medium text-gray-800">
                              {getChefInfo(order.chef_id)?.name || "Noma'lum"}
                            </span>
                          </div>
                        )}

                        {!isFinal && (
                          <div className="flex gap-2 mt-4 flex-wrap">
                            {isUnassignedAndPreparingOrReady && (
                              <Button
                                onClick={() =>
                                  onUpdateOrderStatus(
                                    order.id,
                                    "en_route_to_kitchen",
                                    curierId,
                                    "curier"
                                  )
                                }
                                disabled={isPickupButtonDisabled(order)}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm"
                              >
                                <Truck className="mr-2 h-4 w-4" />
                                Olish uchun yo'lda
                              </Button>
                            )}
                            {isAssignedToThisCourier && (isPreparing || isReady || isEnRouteToKitchen) && (
                              <Button
                                onClick={() =>
                                  onUpdateOrderStatus(
                                    order.id,
                                    "picked_up_from_kitchen",
                                    curierId,
                                    "curier"
                                  )
                                }
                                disabled={isPickedUpButtonDisabled(order)}
                                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm"
                              >
                                <Package className="mr-2 h-4 w-4" />
                                {getPickedUpButtonText(order)}
                              </Button>
                            )}
                            {isPickedUpFromKitchen && isAssignedToThisCourier && (
                              <>
                                <Button
                                  onClick={() =>
                                    onUpdateOrderStatus(
                                      order.id,
                                      "delivered_to_customer",
                                      curierId,
                                      "curier"
                                    )
                                  }
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mijozda
                                </Button>
                                <Button
                                  onClick={() => handleCancelClick(order)}
                                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Bekor qilish
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                        {isFinal && (
                          <p className="text-sm text-gray-500 italic mt-4 text-center">
                            {order.status === "delivered_to_customer"
                              ? "✓ Mijozga yetkazildi"
                              : "✗ Bekor qilingan"}
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
      {curierId && (
        <CurierSettingsDialog
          isOpen={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          curierId={curierId}
          currentName={curierName}
          currentPhone={curierPhone}
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

export default CurierInterFace;