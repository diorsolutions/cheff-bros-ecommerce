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
import { formatQuantity } from "@/lib/utils";
import { Salad } from "lucide-react";

const ClientCustomizationDialog = ({
  isOpen,
  onClose,
  productName,
  customizableIngredients, // { id, name, unit, quantity_needed, is_customizable }
  initialCustomizations, // { ingredient_id: custom_quantity }
  onSaveCustomizations,
}) => {
  const [currentCustomizations, setCurrentCustomizations] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Dialog ochilganda yoki initialCustomizations o'zgarganda holatni yangilash
    // Har bir moslashtiriladigan masalliq uchun boshlang'ich qiymatni o'rnatish
    const initial = {};
    customizableIngredients.forEach(ing => {
      initial[ing.id] = initialCustomizations[ing.id] !== undefined
        ? initialCustomizations[ing.id]
        : ing.quantity_needed; // Agar oldindan moslashtirish bo'lmasa, mahsulotning standart miqdorini olamiz
    });
    setCurrentCustomizations(initial);
  }, [initialCustomizations, isOpen, customizableIngredients]);

  const handleQuantityChange = (ingredientId, value, unit) => {
    const numValue = parseFloat(value);

    if (isNaN(numValue) || numValue < 0) {
      setCurrentCustomizations((prev) => ({
        ...prev,
        [ingredientId]: 0, // Noto'g'ri kiritishda 0 ga o'rnatish
      }));
      return;
    }

    // "dona" birligi uchun faqat butun sonlarni qabul qilish
    if (unit === "dona" && !Number.isInteger(numValue)) {
      toast({
        title: "Xatolik",
        description: "Dona birligi uchun faqat butun sonlar kiritish mumkin.",
        variant: "destructive",
      });
      return;
    }

    setCurrentCustomizations((prev) => ({
      ...prev,
      [ingredientId]: numValue,
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Barcha 0 bo'lgan yoki bo'sh qoldirilgan miqdorlarni olib tashlash
    const filteredCustomizations = Object.entries(currentCustomizations).reduce((acc, [id, qty]) => {
      if (qty > 0) {
        acc[id] = qty;
      }
      return acc;
    }, {});

    onSaveCustomizations(filteredCustomizations);
    toast({
      title: "Muvaffaqiyatli!",
      description: "Masalliqlar moslashtirildi.",
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-300 text-gray-800 sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gray-800">
            "{productName}" uchun masalliqlarni moslashtirish
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {customizableIngredients.length === 0 ? (
            <p className="text-gray-600 text-center">
              Bu mahsulot uchun moslashtiriladigan masalliqlar yo'q.
            </p>
          ) : (
            customizableIngredients.map((ingredient) => (
              <div key={ingredient.id} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={`ing-${ingredient.id}`} className="text-right col-span-2">
                  {ingredient.name} (qo'shimcha)
                </Label>
                <Input
                  id={`ing-${ingredient.id}`}
                  type="number"
                  min="0"
                  step={ingredient.unit === "dona" ? "1" : "0.1"}
                  placeholder="Miqdor"
                  value={currentCustomizations[ingredient.id] || ""}
                  onChange={(e) =>
                    handleQuantityChange(
                      ingredient.id, // ingredient.id ishlatildi
                      e.target.value,
                      ingredient.unit
                    )
                  }
                  className="col-span-1 bg-gray-100 border-gray-300 text-gray-800 no-spinners"
                />
                <span className="text-gray-600 text-sm">{ingredient.unit}</span>
              </div>
            ))
          )}
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
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSaving ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientCustomizationDialog;