import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";
import { User, Phone, Utensils, XCircle, Plus, Trash2 } from "lucide-react";
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

const AdminChefs = ({ chefs, orders }) => {
  const [chefStats, setChefStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAddChefDialogOpen, setIsAddChefDialogOpen] = useState(false);
  const [newChef, setNewChef] = useState({
    username: "",
    password: "",
    name: "",
    phone: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!chefs || !orders) return;

    setLoading(true);
    const calculateChefStats = () => {
      const stats = {};
      chefs.forEach((chef) => {
        stats[chef.id] = {
          name: chef.name,
          phone: chef.phone,
          totalPrepared: 0,
          totalCancelled: 0,
        };
      });

      orders.forEach((order) => {
        if (order.chef_id && stats[order.chef_id]) {
          if (order.status === "ready" || order.status === "delivered_to_customer") {
            stats[order.chef_id].totalPrepared++;
          } else if (order.status === "cancelled") { // Redundant condition `order.chef_id === order.chef_id` removed
            stats[order.chef_id].totalCancelled++;
          }
        }
      });
      setChefStats(stats);
      setLoading(false);
    };

    calculateChefStats();
  }, [chefs, orders]);

  const handleAddChef = async () => {
    if (!newChef.username || !newChef.password || !newChef.name) {
      toast({
        title: "Xatolik",
        description: "Login, parol va ism kiritish majburiy.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("chefs").insert([
        {
          username: newChef.username,
          password_hash: newChef.password, // Bu yerda xashlangan parol bo'lishi kerak
          name: newChef.name,
          phone: newChef.phone || null,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: "Yangi oshpaz qo'shildi.",
      });
      setIsAddChefDialogOpen(false);
      setNewChef({ username: "", password: "", name: "", phone: "" });
    } catch (error) {
      console.error("Oshpaz qo'shishda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Oshpaz qo'shishda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChef = async (chefId, chefName) => {
    try {
      const { error } = await supabase
        .from("chefs")
        .delete()
        .eq("id", chefId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: `${chefName} nomli oshpaz o'chirildi.`,
      });
    } catch (error) {
      console.error("Oshpazni o'chirishda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Oshpazni o'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 py-8">
        Oshpazlar yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white/90">Oshpazlar</h1>
        <Button
          onClick={() => setIsAddChefDialogOpen(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <Plus className="mr-2 h-4 w-4" /> Yangi oshpaz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {Object.values(chefStats).length === 0 ? (
            <Card className="bg-white/10 border-gray-600">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 text-lg">
                  Hozircha oshpazlar yo'q.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.keys(chefStats).map((chefId) => {
              const chef = chefStats[chefId];
              return (
                <motion.div
                  key={chefId}
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
                          {chef.name}
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
                                "{chef.name}" nomli oshpazni o'chirishga
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
                                  handleDeleteChef(chefId, chef.name)
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
                          {chef.phone || "Kiritilmagan"}
                        </span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Utensils className="h-4 w-4 text-green-600" />
                        <span className="text-white/80">
                          Jami tayyorlangan:{" "}
                        </span>
                        <span className="font-bold text-green-600">
                          {chef.totalPrepared}
                        </span>{" "}
                      </p>
                      <p className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-white/80">
                          Jami bekor qilingan:{" "}
                        </span>
                        <span className="font-bold text-red-600">
                          {chef.totalCancelled}
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
        open={isAddChefDialogOpen}
        onOpenChange={setIsAddChefDialogOpen}
      >
        <DialogContent className="bg-white border-gray-300 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              Yangi oshpaz qo'shish
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Login (Username)"
              value={newChef.username}
              onChange={(e) =>
                setNewChef({ ...newChef, username: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              required
            />
            <Input
              type="password"
              placeholder="Parol (Password)"
              value={newChef.password}
              onChange={(e) =>
                setNewChef({ ...newChef, password: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              required
            />
            <Input
              placeholder="Ism Familiya (Name)"
              value={newChef.name}
              onChange={(e) =>
                setNewChef({ ...newChef, name: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              required
            />
            <Input
              placeholder="Telefon raqami (Phone)"
              value={newChef.phone}
              onChange={(e) =>
                setNewChef({ ...newChef, phone: e.target.value })
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
              onClick={handleAddChef}
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

export default AdminChefs;