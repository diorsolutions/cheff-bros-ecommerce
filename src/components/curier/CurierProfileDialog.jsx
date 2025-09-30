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

const CurierProfileDialog = ({ isOpen, onClose, curierId, currentName, onNameUpdated }) => {
  const [name, setName] = useState(currentName || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(currentName || "");
  }, [currentName]);

  const handleSaveName = async () => {
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
        .update({ name: name.trim() })
        .eq("id", curierId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: "Ism muvaffaqiyatli yangilandi.",
      });
      onNameUpdated(name.trim()); // O'zgartirilgan nomni yuqori komponentga qaytarish
      onClose();
    } catch (error) {
      console.error("Ismni yangilashda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Ismni yangilashda xatolik yuz berdi.",
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
          <DialogTitle className="text-white">Ismni o'zgartirish</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Bekor qilish
            </Button>
          </DialogClose>
          <Button onClick={handleSaveName} disabled={isSaving}>
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CurierProfileDialog;