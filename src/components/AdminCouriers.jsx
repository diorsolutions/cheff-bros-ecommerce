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
    return <div className="text-center text-gray-600 py-8">Kuryerlar yuklanmoqda...</div>; {/* Matn rangi yangilandi */}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Kuryerlar</h1> {/* Matn rangi yangilandi */}
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
            <Card className="bg-white border-gray-300"> {/* Card rangi va chegarasi yangilandi */}
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 text-lg">Hozircha kuryerlar yo'q.</p> {/* Matn rangi yangilandi */}
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
                  <Card className="bg-white border-gray-300"> {/* Card rangi va chegarasi yangilandi */}
                    <CardHeader>
                      <CardTitle className="text-gray-800 flex justify-between items-center"> {/* Matn rangi yangilandi */}
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-purple-600" /> {/* Icon rangi yangilandi */}
                          {courier.name}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-100" {/* Ranglar yangilandi */}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" /> {/* Rang yangilandi */}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-gray-300"> {/* Dialog rangi va chegarasi yangilandi */}
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-800"> {/* Matn rangi yangilandi */}
                                O'chirishni tasdiqlang
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600"> {/* Matn rangi yangilandi */}
                                "{courier.name}" nomli kuryerni o'chirishga
                                ishonchingiz komilmi? Bu amalni orqaga qaytarib
                                bo'lmaydi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-gray-800 border-gray-300 hover:bg-gray-200"> {/* Ranglar yangilandi */}
                                Bekor qilish
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCourier(curierId, courier.name)} // curierId ni to'g'ri uzatamiz
                                className="bg-red-600 hover:bg-red-700 text-white" {/* Ranglar yangilandi */}
                              >
                                O'chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-gray-600"> {/* Matn rangi yangilandi */}
                      <p className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" /> {/* Icon rangi yangilandi */}
                        Telefon: <span className="font-medium text-gray-800">{courier.phone || "Kiritilmagan"}</span> {/* Matn rangi yangilandi */}
                      </p>
                      <p className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-600" /> {/* Icon rangi yangilandi */}
                        Jami yetkazilgan: <span className="font-bold text-green-600">{courier.totalDelivered}</span> {/* Matn rangi yangilandi */}
                      </p>
                      <p className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" /> {/* Icon rangi yangilandi */}
                        Jami bekor qilingan: <span className="font-bold text-red-600">{courier.totalCancelled}</span> {/* Matn rangi yangilandi */}
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
        <DialogContent className="bg-white border-gray-300"> {/* Dialog rangi va chegarasi yangilandi */}
          <DialogHeader>
            <DialogTitle className="text-gray-800">Yangi kuryer qo'shish</DialogTitle> {/* Matn rangi yangilandi */}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Login (Username)"
              value={newCourier.username}
              onChange={(e) =>
                setNewCourier({ ...newCourier, username: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800" {/* Ranglar yangilandi */}
              required
            />
            <Input
              type="password"
              placeholder="Parol (Password)"
              value={newCourier.password}
              onChange={(e) =>
                setNewCourier({ ...newCourier, password: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800" {/* Ranglar yangilandi */}
              required
            />
            <Input
              placeholder="Ism Familiya (Name)"
              value={newCourier.name}
              onChange={(e) =>
                setNewCourier({ ...newCourier, name: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800" {/* Ranglar yangilandi */}
              required
            />
            <Input
              placeholder="Telefon raqami (Phone)"
              value={newCourier.phone}
              onChange={(e) =>
                setNewCourier({ ...newCourier, phone: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800" {/* Ranglar yangilandi */}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="text-gray-800 border-gray-300 hover:bg-gray-200"> {/* Ranglar yangilandi */}
                Bekor qilish
              </Button>
            </DialogClose>
            <Button onClick={handleAddCourier} disabled={isSaving} className="bg-orange-500 hover:bg-orange-600 text-white"> {/* Ranglar yangilandi */}
              {isSaving ? "Qo'shilmoqda..." : "Qo'shish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCouriers;