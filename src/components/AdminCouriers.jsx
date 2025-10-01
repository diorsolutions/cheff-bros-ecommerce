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
    console.log("AdminCouriers useEffect triggered. Current curiers prop:", curiers); // Debug log
    if (!curiers || !orders) return;

    setLoading(true);
    const calculateCourierStats = () => {
      const stats = {};
      curiers.forEach(curier => {
        stats[curier.id] = {
          name: curier.name,
          phone: curier.phone,
          totalDelivered: 0,
          totalCancelled: 0,
        };
      });

      orders.forEach(order => {
        if (order.curier_id && stats[order.curier_id]) {
          if (order.status === "confirmed") {
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
    return <div className="text-center text-gray-400 py-8">Kuryerlar yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Kuryerlar</h1>
        <Button
          onClick={() => setIsAddCourierDialogOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <Plus className="mr-2 h-4 w-4" /> Yangi kuryer
        </Button>
      </div>

      <div className="grid gap-4">
        <AnimatePresence>
          {Object.values(courierStats).length === 0 ? (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-8 text-center">
                <p className="text-gray-400 text-lg">Hozircha kuryerlar yo'q.</p>
              </CardContent>
            </Card>
          ) : (
            Object.keys(courierStats).map((curierId) => { // curierId ni key sifatida ishlatamiz
              const courier = courierStats[curierId];
              return (
                <motion.div
                  key={curierId} // key ni curierId ga o'zgartirdik
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card className="bg-white/10 border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-purple-400" />
                          {courier.name}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gradient-to-br from-slate-900 to-purple-900 border-white/20">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                O'chirishni tasdiqlang
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-300">
                                "{courier.name}" nomli kuryerni o'chirishga
                                ishonchingiz komilmi? Bu amalni orqaga qaytarib
                                bo'lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourier(curierId, courier.name)} // curierId ni to'g'ri uzatamiz
                                className="bg-red-600 hover:bg-red-700"
                              >
                                O'chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-gray-300">
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        Telefon: <span className="font-medium text-white">{courier.phone || "Kiritilmagan"}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-400" />
                        Jami yetkazilgan: <span className="font-bold text-green-400">{courier.totalDelivered}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-400" />
                        Jami bekor qilingan: <span className="font-bold text-red-400">{courier.totalCancelled}</span>
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isAddCourierDialogOpen} onOpenChange={setIsAddCourierDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-slate-900 to-purple-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">Yangi kuryer qo'shish</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Login (Username)"
              value={newCourier.username}
              onChange={(e) =>
                setNewCourier({ ...newCourier, username: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white"
              required
            />
            <Input
              type="password"
              placeholder="Parol (Password)"
              value={newCourier.password}
              onChange={(e) =>
                setNewCourier({ ...newCourier, password: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white"
              required
            />
            <Input
              placeholder="Ism Familiya (Name)"
              value={newCourier.name}
              onChange={(e) =>
                setNewCourier({ ...newCourier, name: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white"
              required
            />
            <Input
              placeholder="Telefon raqami (Phone)"
              value={newCourier.phone}
              onChange={(e) =>
                setNewCourier({ ...newCourier, phone: e.target.value })
              }
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Bekor qilish
              </Button>
            </DialogClose>
            <Button onClick={handleAddCourier} disabled={isSaving}>
              {isSaving ? "Qo'shilmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouriers;