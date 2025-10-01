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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Tabs komponentlari
import CurierStatistics from "./CurierStatistics"; // Yangi import

const CurierSettingsDialog = ({ isOpen, onClose, curierId, currentName, currentPhone, onNameUpdated, orders }) => {
  const [name, setName] = useState(currentName || "");
  const [phone, setPhone] = useState(currentPhone || ""); // Yangi holat
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // Yangi holat

  useEffect(() => {
    setName(currentName || "");
    setPhone(currentPhone || ""); // Telefon raqamini ham yangilash
    setActiveTab("profile"); // Dialog ochilganda har doim "profile" tabini ko'rsatish
  }, [currentName, currentPhone, isOpen]); // isOpen o'zgarganda ham reset qilish

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
        .from("curiers")
        .update({ name: name.trim(), phone: phone.trim() }) // Telefon raqamini ham yangilash
        .eq("id", curierId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: "Profil ma'lumotlari muvaffaqiyatli yangilandi.",
      });
      onNameUpdated(name.trim(), phone.trim()); // O'zgartirilgan nom va telefonni yuqori komponentga qaytarish
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
      <DialogContent className="bg-gradient-to-br from-slate-900 to-purple-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">Kuryer sozlamalari</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 border-white/20">
            <TabsTrigger value="profile" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-active-orange">
              Profil
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-active-orange">
              Statistika
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profile" className="py-4">
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-white">
                  Ism
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="col-span-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right text-white">
                  Telefon
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="col-span-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Bekor qilish
                </Button>
              </DialogClose>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saqlanmoqda..." : "Saqlash"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="statistics" className="py-4">
            <CurierStatistics curierId={curierId} orders={orders} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CurierSettingsDialog;