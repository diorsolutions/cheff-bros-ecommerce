import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, MoreVertical, Truck, LogOut, User } from "lucide-react";
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
import CurierProfileDialog from "./CurierProfileDialog"; // Yangi import

const CurierInterFace = ({ orders, onUpdateOrderStatus }) => {
  const navigate = useNavigate();
  const [curierName, setCurierName] = useState("Kuryer");
  const [curierId, setCurierId] = useState(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

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
          // Agar ma'lumot topilmasa, login sahifasiga qaytarish
          handleLogout();
        } else if (data) {
          setCurierName(data.name || storedUsername);
        }
      } else {
        handleLogout(); // Agar username yoki id yo'q bo'lsa, chiqish
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
      case "confirmed":
        return "Tasdiqlangan";
      case "cancelled":
        return "Bekor qilingan";
      default:
        return "Noma'lum";
    }
  };

  // Faqat "new" yoki "confirmed" statusdagi buyurtmalarni ko'rsatish
  const relevantOrders = orders.filter(
    (order) => order.status === "new" || order.status === "confirmed"
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
              onClick={() => setShowProfileDialog(true)}
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
                const isConfirmed = order.status === "confirmed";
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
                        isConfirmed
                          ? "from-green-500/10 to-green-500/5 border-green-500/30 opacity-80"
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
                              {new Date(order.created_at).toLocaleString(
                                "uz-UZ"
                              )}
                            </span>
                            {!isConfirmed ? (
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
                                  <DropdownMenuItem
                                    onClick={() =>
                                      onUpdateOrderStatus(order.id, "confirmed")
                                    }
                                    className="text-green-400 hover:!bg-green-500/20 focus:bg-green-500/20 focus:text-green-300"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Yetkazib berildi
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span className="text-xs text-gray-400 italic">
                                ✓ Yetkazib berildi
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
                          <Truck className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">Status:</span>
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              order.status === "new"
                                ? "bg-blue-500/20 text-blue-400"
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
        </main>

      {curierId && (
        <CurierProfileDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          curierId={curierId}
          currentName={curierName}
          onNameUpdated={handleNameUpdated}
        />
      )}
    </div>
  );
};

export default CurierInterFace;