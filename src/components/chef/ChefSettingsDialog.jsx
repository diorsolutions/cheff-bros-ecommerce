import React, { useState, useEffect } from "react";
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
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChefStatistics from "./ChefStatistics"; // Yangi import

const ChefSettingsDialog = ({
  isOpen,
  onClose,
  chefId,
  currentName,
  currentPhone,
  onNameUpdated,
  orders,
}) => {
  const [name, setName] = useState(currentName || "");
  const [phone, setPhone] = useState(currentPhone || "");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    setName(currentName || "");
    setPhone(currentPhone || "");
    setActiveTab("profile");
  }, [currentName, currentPhone, isOpen]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({
        title: "Xatolik",
        description: "Ism bo'sh bo'lishi mumkin emas.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("chefs")
        .update({ name: name.trim(), phone: phone.trim() })
        .eq("id", chefId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: "Profil ma'lumotlari muvaffaqiyatli yangilandi.",
      });
      onNameUpdated(name.trim(), phone.trim());
      onClose();
    } catch (error) {
      console.error("Profilni yangilashda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Profilni yangilashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-300">
        <DialogHeader>
          <DialogTitle className="text-gray-800">Oshpaz sozlamalari</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 border-gray-300">
            <TabsTrigger
              value="profile"
              className="text-gray-800 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Profil
            </TabsTrigger>
            <TabsTrigger
              value="statistics"
              className="text-gray-800 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              Statistika
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-gray-800">
                  Ism
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right text-gray-800">
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="col-span-3 bg-gray-100 border-gray-300 text-gray-800 placeholder:text-gray-500"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
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
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="statistics" className="py-4">
            <ChefStatistics chefId={chefId} orders={orders} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ChefSettingsDialog;