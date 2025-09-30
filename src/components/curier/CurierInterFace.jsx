import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, MoreVertical, Truck, LogOut, User, Package } from "lucide-react";
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
          .select("name")
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

  const handleNameUpdated = (newName) => {
    setCurierName(newName);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-500";
      case "on_the_way":
        return "bg-orange-500"; // Yangi status uchun rang
      case "confirmed":
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
      case "on_the_way":
        return "Buyurtma menda"; // Yangi status uchun matn
      case "confirmed":
        return "Yetkazib berildi";
      case "cancelled":
        return "Bekor qilingan";
      default:
        return "Noma'lum";
    }
  };

  // Faqat "new" yoki "on_the_way" statusdagi buyurtmalarni ko'rsatish
  const relevantOrders = orders.filter(
    (order) => order.status === "new" || order.status === "on_the_way"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 text-white">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-orange-400" />
            <h1 className="text-2xl font-bold text-white">Kuryer Paneli</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setShowSettingsDialog(true)} // Dialogni ochish
              className="text-white hover:bg-white/10"
            >
              <User className="mr-2 h-4 w-4" />
              {curierName}
            </Button>
            <Button onClick={handleLogout} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid gap-4">
          <AnimatePresence>
            {relevantOrders.length === 0 ? (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-400 text-lg">
                    Hozircha yetkazib beriladigan buyurtmalar yo'q.
                  </p>
                </CardContent>
              </Card>
            ) : (
              relevantOrders.map((order) => {
                const isNew = order.status === "new";
                const isOnTheWay = order.status === "on_the_way";
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
                                order.status === "new" || order.status === "on_the_way" ? "animate-pulse" : ""
                              }`}
                            ></span>
                            Buyurtma{" "}
                            <span className="text-gray-400">
                              {order.id.substring(0, 8)}
                            </span>
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">
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
                                    className="text-white hover:bg-white/20"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-slate-800 border-white/20">
                                  {isNew && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        onUpdateOrderStatus(order.id, "on_the_way", curierId)
                                      }
                                      className="text-orange-400 hover:!bg-orange-500/20 focus:bg-orange-500/20 focus:text-orange-300"
                                    >
                                      <Package className="mr-2 h-4 w-4" />
                                      Buyurtma menda
                                    </DropdownMenuItem>
                                  )}
                                  {isOnTheWay && (
                                    <>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(order.id, "confirmed", curierId)
                                        }
                                        className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Yetkazib berildi
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          onUpdateOrderStatus(order.id, "cancelled", curierId)
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
                            )}
                            {isFinal && (
                              <span className="text-xs text-gray-400 italic">
                                {order.status === "confirmed"
                                  ? "✓ Yetkazib berildi"
                                  : "✗ Bekor qilingan"}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center text-sm text-gray-300">
                          <p>
                            <span className="font-bold text-gray-100/50">Mijoz:</span>{" "}
                            {order.customer_info.name}
                          </p>
                          <p>
                            <span className="font-bold text-gray-100/50">Tel:</span>{" "}
                            {order.customer_info.phone}
                          </p>
                        </div>
                        <p className="text-sm text-gray-300">
                          <span className="font-bold text-gray-100/50">Manzil:</span>{" "}
                          {order.location}
                        </p>
                        <div className="border-t border-white/20 pt-2 mt-2 flex justify-between items-center">
                          <span className="text-white font-bold">Jami:</span>
                          <span className="text-orange-400 text-lg font-bold">
                            {order.total_price.toLocaleString()} so'm
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Truck className="h-4 w-4 text-gray-400" />
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
          onNameUpdated={handleNameUpdated}
          orders={orders} // Statistikani hisoblash uchun buyurtmalarni uzatamiz
        />
      )}
    </div>
  );
};

export default CurierInterFace;