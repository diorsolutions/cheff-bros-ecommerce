import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { User, Phone, Package, XCircle, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminCouriers = ({ curiers, orders }) => {
  const [courierStats, setCourierStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddCourierDialogOpen, setIsAddCourierDialogOpen] = useState(false);
  const [newCourier, setNewCourier] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!curiers || !orders) return;

    setLoading(true);
    const calculateCourierStats = () => {
      const stats = {};
      curiers.forEach((curier) => {
        stats[curier.id] = {
          name: curier.name,
          phone: curier.phone,
          totalDelivered: 0,
          totalCancelled: 0,
        };
      });

      orders.forEach((order) => {
        if (order.curier_id && stats[order.curier_id]) {
          if (order.status === "delivered_to_customer") {
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

  const handleAddCourier = async () => {
    if (!newCourier.username || !newCourier.password || !newCourier.name) {
      toast({
        title: "Xatolik",
        description: "Login, parol va ism kiritish majburiy.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Haqiqiy ilovalarda parolni xashlash kerak!
      const { error } = await supabase.from("curiers").insert([
        {
          username: newCourier.username,
          password_hash: newCourier.password, // Bu yerda xashlangan parol bo'lishi kerak
          name: newCourier.name,
          phone: newCourier.phone || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: "Yangi kuryer qo'shildi.",
      });
      setIsAddCourierDialogOpen(false);
      setNewCourier({ username: "", password: "", name: "", phone: "" });
    } catch (error) {
      console.error("Kuryer qo'shishda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Kuryer qo'shishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourier = async (curierId, curierName) => {
    try {
      const { error } = await supabase
        .from("curiers")
        .delete()
        .eq("id", curierId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: `${curierName} nomli kuryer o'chirildi.`,
      });
    } catch (error) {
      console.error("Kuryerni o'chirishda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Kuryerni o'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 py-8">
        Kuryerlar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white/90">Kuryerlar</h1>
        <Button
          onClick={() => setIsAddCourierDialogOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <Plus className="mr-2 h-4 w-4" /> Yangi kuryer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {Object.values(courierStats).length === 0 ? (
            <Card className="bg-white/10 border-gray-600">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 text-lg">
                  Hozircha kuryerlar yo'q.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.keys(courierStats).map((curierId) => {
              const courier = courierStats[curierId];
              return (
                <motion.div
                  key={curierId}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-white/10 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-gray-800 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-white text-xl">
                          <User className="h-5 w-5 text-purple-100" />
                          {courier.name}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-500 rounded-xl" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-gray-300">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-800">
                                O'chirishni tasdiqlang
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                "{courier.name}" nomli kuryerni o'chirishga
                                ishonchingiz komilmi? Bu amalni orqaga qaytarib
                                bo'lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-gray-800 border-gray-300 hover:bg-gray-200">
                                Bekor qilish
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteCourier(curierId, courier.name)
                                }
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                O'chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-gray-600">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-white/80" />
                        <span className="text-white/80">Telefon: </span>
                        <span className="font-medium text-white">
                          {courier.phone || "Kiritilmagan"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" />
                        <span className="text-white/80">
                          Jami yetkazilgan:{" "}
                        </span>
                        <span className="font-bold text-green-600">
                          {courier.totalDelivered}
                        </span>{" "}
                      </p>
                      <p className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-white/80">
                          Jami bekor qilingan:{" "}
                        </span>
                        <span className="font-bold text-red-600">
                          {courier.totalCancelled}
                        </span>{" "}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={isAddCourierDialogOpen}
        onOpenChange={setIsAddCourierDialogOpen}
      >
        <DialogContent className="bg-white border-gray-300 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              Yangi kuryer qo'shish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Login (Username)"
              value={newCourier.username}
              onChange={(e) =>
                setNewCourier({ ...newCourier, username: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              required
            />
            <Input
              type="password"
              placeholder="Parol (Password)"
              value={newCourier.password}
              onChange={(e) =>
                setNewCourier({ ...newCourier, password: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              required
            />
            <Input
              placeholder="Ism Familiya (Name)"
              value={newCourier.name}
              onChange={(e) =>
                setNewCourier({ ...newCourier, name: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              required
            />
            <Input
              placeholder="Telefon raqami (Phone)"
              value={newCourier.phone}
              onChange={(e) =>
                setNewCourier({ ...newCourier, phone: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="text-gray-800 border-gray-300 hover:bg-gray-200"
              >
                Bekor qilish
              </Button>
            </DialogClose>
            <Button
              onClick={handleAddCourier}
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? "Qo'shilmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouriers;