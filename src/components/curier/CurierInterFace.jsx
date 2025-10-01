import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  MoreVertical,
  Truck,
  LogOut,
  User,
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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import CurierSettingsDialog from "./CurierSettingsDialog"; // Yangi nom

const CurierInterFace = ({ orders, onUpdateOrderStatus }) => {
  const navigate = useNavigate();
  const [curierName, setCurierName] = useState("Kuryer");
  const [curierPhone, setCurierPhone] = useState(""); // Yangi holat
  const [curierId, setCurierId] = useState(null);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false); // Dialog holati

  useEffect(() => {
    const fetchCurierInfo = async () => {
      const storedUsername = localStorage.getItem("curierUsername");
      const storedId = localStorage.getItem("curierId");

      if (storedUsername && storedId) {
        setCurierId(storedId);
        const { data, error } = await supabase
          .from("curiers")
          .select("name, phone") // Telefon raqamini ham olamiz
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
    navigate("/login", { replace: true });
    toast({
      title: "Chiqish",
      description: "Tizimdan muvaffaqiyatli chiqdingiz.",
    });
  };

  const handleNameUpdated = (newName, newPhone) => {
    setCurierName(newName);
    setCurierPhone(newPhone);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "en_route_to_kitchen": // Yangi status
        return "bg-yellow-500";
      case "picked_up_from_kitchen": // Yangi status
        return "bg-orange-500";
      case "delivered_to_customer": // Yangi status
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "new":
        return "Yangi";
      case "en_route_to_kitchen":
        return "Olish uchun yo'lda";
      case "picked_up_from_kitchen":
        return "Buyurtma menda";
      case "delivered_to_customer":
        return "Mijozda";
      case "cancelled":
        return "Bekor qilingan";
      default:
        return "Noma'lum";
    }
  };

  // Faqat "new", "en_route_to_kitchen" yoki "picked_up_from_kitchen" statusdagi buyurtmalarni ko'rsatish
  const relevantOrders = orders.filter(
    (order) =>
      order.status === "new" ||
      (order.status === "en_route_to_kitchen" &&
        order.curier_id === curierId) ||
      (order.status === "picked_up_from_kitchen" &&
        order.curier_id === curierId)
  );

  return (
    <div className="min-h-screen bg-[#fefefe] text-gray-800">
      {" "}
      {/* Fon va matn rangi yangilandi */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-30">
        {" "}
        {/* Header rangi yangilandi */}
        <div className="mx-auto px-5 py-3 flex items-center justify-between border border-violet-300">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-orange-500" />{" "}
            {/* Icon rangi yangilandi */}
            <h1 className="text-2xl nor_tablet:text-xs font-bold text-gray-800">
              Buyurtmalar Paneli
            </h1>{" "}
            {/* Matn rangi yangilandi */}
          </div>
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="ghost"
              onClick={() => setShowSettingsDialog(true)} // Dialogni ochish
              className="text-gray-800 hover:bg-gray-300 bg-gray-200 rounded-[0.3rem] gap-2"
            >
              <User className="h-4 w-4" />
              <span className="nor_tablet:hidden">{curierName}</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-gray-800 hover:bg-gray-300 bg-gray-200 rounded-[0.3rem] gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="nor_tablet:hidden">Chiqish</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="p-6 bg-[#f6f6f6]">
        {" "}
        {/* Asosiy kontent foni yangilandi */}
        <div className="grid gap-4">
          <AnimatePresence>
            {relevantOrders.length === 0 ? (
              <Card className="bg-white/40 border-gray-100">
                {" "}
                {/* Card rangi va chegarasi yangilandi */}
                <CardContent className="p-8 text-center ">
                  <p className="text-gray-600 text-lg">
                    {" "}
                    {/* Matn rangi yangilandi */}
                    Hozircha yetkazib beriladigan buyurtmalar yo'q.
                  </p>
                </CardContent>
              </Card>
            ) : (
              relevantOrders.map((order) => {
                const isNew = order.status === "new";
                const isEnRouteToKitchen =
                  order.status === "en_route_to_kitchen";
                const isPickedUpFromKitchen =
                  order.status === "picked_up_from_kitchen";
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
                      className={`bg-white border-gray-300 shadow-[0_5px_15px_0_rgba(0,0,0,0.15)] transition-all duration-300 ${
                        /* Card rangi va chegarasi yangilandi */
                        order.status === "delivered_to_customer"
                          ? "bg-green-100 border-green-300 opacity-80" /* Ranglar yangilandi */
                          : order.status === "cancelled"
                          ? "bg-red-100 border-red-300 opacity-80" /* Ranglar yangilandi */
                          : order.status === "picked_up_from_kitchen"
                          ? "bg-orange-100 border-orange-300" /* Ranglar yangilandi */
                          : order.status === "en_route_to_kitchen"
                          ? "bg-yellow-100 border-yellow-300" /* Ranglar yangilandi */
                          : "bg-white"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-gray-800 flex items-center gap-3 text-base">
                            {" "}
                            {/* Matn rangi yangilandi */}
                            <span
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                order.status
                              )} ${!isFinal ? "animate-pulse" : ""}`}
                            ></span>
                            <span className="nor_tablet:text-[0.9rem]">
                              Buyurtma{" "}
                            </span>
                            <span className="text-gray-500 nor_tablet:hidden">
                              {" "}
                              {/* Matn rangi yangilandi */}
                              {order.id.substring(0, 8)}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-1 mr-[-0.9rem]">
                            <span className="text-gray-500 nor_tablet:text-[0.7rem]">
                              {" "}
                              {/* Matn rangi yangilandi */}
                              {new Date(order.created_at).toLocaleString(
                                "uz-UZ"
                              )}
                            </span>
                            {!isFinal && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-800 hover:bg-gray-200"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white border-gray-300">
                                  {isNew && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(
                                          order.id,
                                          "en_route_to_kitchen",
                                          curierId
                                        )
                                      }
                                      className="text-yellow-600 hover:!bg-yellow-100 focus:bg-yellow-100 focus:text-yellow-700" /* Ranglar yangilandi */
                                    >
                                      <Truck className="mr-2 h-4 w-4" />
                                      Olish uchun yo'lda
                                    </DropdownMenuItem>
                                  )}
                                  {isEnRouteToKitchen && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(
                                          order.id,
                                          "picked_up_from_kitchen",
                                          curierId
                                        )
                                      }
                                      className="text-orange-600 hover:!bg-orange-100 focus:bg-orange-100 focus:text-orange-700" /* Ranglar yangilandi */
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      Buyurtma menda
                                    </DropdownMenuItem>
                                  )}
                                  {isPickedUpFromKitchen && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "delivered_to_customer",
                                            curierId
                                          )
                                        }
                                        className="text-green-600 hover:!bg-green-100 focus:bg-green-100 focus:text-green-700" /* Ranglar yangilandi */
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mijozda
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(
                                            order.id,
                                            "cancelled",
                                            curierId
                                          )
                                        }
                                        className="text-red-600 hover:!bg-red-100 focus:bg-red-100 focus:text-red-700" /* Ranglar yangilandi */
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Bekor qilish
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {isFinal && (
                              <span className="text-xs text-gray-500 italic">
                                {" "}
                                {/* Matn rangi yangilandi */}
                                {order.status === "delivered_to_customer"
                                  ? "✓ Mijozga yetkazildi"
                                  : "✗ Bekor qilingan"}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          {" "}
                          {/* Matn rangi yangilandi */}
                          <p className="flex items-center mob_small:text-[0.8rem]">
                            <span className="font-bold text-gray-800">
                              Mijoz:
                            </span>{" "}
                            {/* Matn rangi yangilandi */}
                            {order.customer_info.name}
                          </p>
                          <p>
                            <span className="font-bold text-gray-800 mob_small:text-[0.8rem]">
                              Tel:
                            </span>{" "}
                            {/* Matn rangi yangilandi */}
                            <span className="mob_small:text-[0.8rem]">
                              <a
                                href={`tel:${order.customer_info.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {order.customer_info.phone}
                              </a>
                            </span>
                          </p>
                        </div>
                        <p className="text-sm text-gray-600">
                          {" "}
                          {/* Matn rangi yangilandi */}
                          <span className="font-bold text-gray-800 mob_small:text-[0.8rem]">
                            Manzil:
                          </span>{" "}
                          {/* Matn rangi yangilandi */}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${order.location}`}
                            className="text-blue-600 hover:underline"
                          >
                            Ochish
                          </a>
                        </p>
                        <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between items-center">
                          {" "}
                          {/* Chegara rangi yangilandi */}
                          <span className="text-gray-800 font-bold mob_small:text-[0.8rem]">
                            Jami:
                          </span>{" "}
                          {/* Matn rangi yangilandi */}
                          <span className="text-orange-500 text-lg nor_tablet:text-[0.9rem] font-bold">
                            {" "}
                            {/* Matn rangi yangilandi */}
                            {order.total_price.toLocaleString()} so'm
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Truck className="h-4 w-4 text-gray-500" />{" "}
                          {/* Icon rangi yangilandi */}
                          <span className="text-sm text-gray-500 mob_small:text-[0.8rem]">
                            Status:
                          </span>{" "}
                          {/* Matn rangi yangilandi */}
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded mob_small:text-[0.8rem] ${
                              order.status === "new"
                                ? "bg-blue-100 text-blue-600" /* Ranglar yangilandi */
                                : order.status === "en_route_to_kitchen"
                                ? "bg-yellow-100 text-yellow-600" /* Ranglar yangilandi */
                                : order.status === "picked_up_from_kitchen"
                                ? "bg-orange-100 text-orange-600" /* Ranglar yangilandi */
                                : order.status === "delivered_to_customer"
                                ? "bg-green-100 text-green-600" /* Ranglar yangilandi */
                                : "bg-red-100 text-red-600" /* Ranglar yangilandi */
                            }`}
                          >
                            {getStatusText(order.status)}
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
      </main>
      {curierId && (
        <CurierSettingsDialog
          isOpen={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          curierId={curierId}
          currentName={curierName}
          currentPhone={curierPhone} // Telefon raqamini uzatamiz
          onNameUpdated={handleNameUpdated}
          orders={orders} // Statistikani hisoblash uchun buyurtmalarni uzatamiz
        />
      )}
    </div>
  );
};

export default CurierInterFace;
