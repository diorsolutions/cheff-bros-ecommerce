import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Salad, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
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
import { formatQuantity } from "@/lib/utils"; // formatQuantity import qilindi

const AdminIngredients = ({
  allProducts,
  allIngredients,
  allProductIngredients,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentIngredient, setCurrentIngredient] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  // linkedProductsForEdit endi faqat ma'lumotni ko'rsatish uchun ishlatiladi, tahrirlash uchun emas
  const [linkedProductsForEdit, setLinkedProductsForEdit] = useState([]); // { product_id, quantity_needed, product_name }

  useEffect(() => {
    if (!isDialogOpen) {
      setCurrentIngredient(null);
      setLinkedProductsForEdit([]);
    }
  }, [isDialogOpen]);

  const openDialog = (ingredient = null) => {
    setCurrentIngredient(
      ingredient || {
        name: "",
        stock_quantity: 0,
        unit: "dona",
      }
    );

    if (ingredient) {
      // Load existing product links for this ingredient
      const existingLinks = allProductIngredients
        .filter((pi) => pi.ingredient_id === ingredient.id)
        .map((pi) => {
          const product = allProducts.find((p) => p.id === pi.product_id);
          return {
            product_id: pi.product_id,
            quantity_needed: pi.quantity_needed,
            product_name: product ? product.name : "Noma'lum mahsulot",
          };
        });
      setLinkedProductsForEdit(existingLinks);
    } else {
      setLinkedProductsForEdit([]);
    }
    setIsDialogOpen(true);
  };

  // handleLinkedProductQuantityChange funksiyasi olib tashlandi, chunki endi read-only
  // const handleLinkedProductQuantityChange = (productId, quantity) => {
  //   setLinkedProductsForEdit((prev) =>
  //     prev.map((link) =>
  //       link.product_id === productId
  //         ? { ...link, quantity_needed: Number(quantity) }
  //         : link
  //     )
  //   );
  // };

  const handleSaveIngredient = async () => {
    if (
      !currentIngredient.name ||
      currentIngredient.stock_quantity === null ||
      currentIngredient.stock_quantity < 0 ||
      !currentIngredient.unit
    ) {
      toast({
        title: "Xatolik",
        description: "Masalliq nomi, miqdori va birligini kiritish majburiy.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let ingredientId = currentIngredient.id;
      let error;

      if (currentIngredient.id) {
        // Update existing ingredient
        const { error: updateError } = await supabase
          .from("ingredients")
          .update({
            name: currentIngredient.name,
            stock_quantity: Number(currentIngredient.stock_quantity),
            unit: currentIngredient.unit,
          })
          .eq("id", currentIngredient.id);
        error = updateError;
      } else {
        // Insert new ingredient
        const { data, error: insertError } = await supabase
          .from("ingredients")
          .insert([
            {
              name: currentIngredient.name,
              stock_quantity: Number(currentIngredient.stock_quantity),
              unit: currentIngredient.unit,
            },
          ])
          .select("id")
          .single();
        if (insertError) throw insertError;
        ingredientId = data.id;
        error = insertError;
      }

      if (error) throw error;

      // product_ingredients bog'lanishlarini yangilash qismi olib tashlandi,
      // chunki bu bog'lanishlar faqat AdminProducts orqali boshqariladi.
      // for (const link of linkedProductsForEdit) {
      //   await supabase
      //     .from("product_ingredients")
      //     .update({ quantity_needed: link.quantity_needed })
      //     .eq("ingredient_id", ingredientId)
      //     .eq("product_id", link.product_id);
      // }

      toast({
        title: "Muvaffaqiyatli!",
        description: `Masalliq muvaffaqiyatli saqlandi.`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Masalliqni saqlashda xatolik:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Masalliqni saqlashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIngredient = async (ingredientId, ingredientName) => {
    try {
      // Delete associated product_ingredients first
      await supabase
        .from("product_ingredients")
        .delete()
        .eq("ingredient_id", ingredientId);

      // Then delete the ingredient
      const { error } = await supabase
        .from("ingredients")
        .delete()
        .eq("id", ingredientId);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: `${ingredientName} nomli masalliq o'chirildi.`,
      });
    } catch (error) {
      console.error("Masalliqni o'chirishda xatolik:", error);
      toast({
        title: "Xatolik",
        description:
          error.message || "Masalliqni o'chirishda xatolik yuz berdi.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Masalliqlar</h1>
        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <Plus className="mr-2 h-4 w-4" /> Yangi masalliq
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {allIngredients.length === 0 ? (
            <Card className="bg-white/10 border-gray-600">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 text-lg">
                  Hozircha masalliqlar yo'q.
                </p>
              </CardContent>
            </Card>
          ) : (
            allIngredients.map((ingredient) => (
              <motion.div
                key={ingredient.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Card className="bg-white/10 border-gray-600 rounded-[0.5rem] h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-gray-800 flex justify-between items-start">
                      <span className="flex-1 text-xl mr-4 text-white/90">
                        {ingredient.name}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-200 hover:bg-gray-200 rounded-[0.3rem]"
                          onClick={() => openDialog(ingredient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-gray-300">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-gray-800">
                                O'chirishni tasdiqlang
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-600">
                                "{ingredient.name}" masallig'ini o'chirishga
                                ishonchingiz komilmi? Bu amalni orqaga qaytarib
                                bo'lmaydi va unga bog'langan mahsulotlar ham
                                ta'sirlanadi.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-gray-800 border-gray-300 hover:bg-gray-200">
                                Bekor qilish
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDeleteIngredient(
                                    ingredient.id,
                                    ingredient.name
                                  )
                                }
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                O'chirish
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <p className="text-white/80 font-bold text-lg">
                      <span className="text-gray-200 font-bold">Miqdori: </span>
                      {formatQuantity(ingredient.stock_quantity, ingredient.unit)}{" "}
                      {ingredient.unit}
                    </p>
                    <div className="mt-4">
                      <h4 className="text-gray-200 font-bold mb-2 flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" /> Bog'langan mahsulotlar:
                      </h4>
                      {allProductIngredients.filter(
                        (pi) => pi.ingredient_id === ingredient.id
                      ).length === 0 ? (
                        <p className="text-gray-400 text-sm italic">
                          Hech qanday mahsulotga bog'lanmagan.
                        </p>
                      ) : (
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {allProductIngredients
                            .filter((pi) => pi.ingredient_id === ingredient.id)
                            .map((pi) => {
                              const product = allProducts.find(
                                (p) => p.id === pi.product_id
                              );
                              return (
                                product && (
                                  <li key={product.id}>
                                    {product.name} ({formatQuantity(pi.quantity_needed, ingredient.unit)}{" "}
                                    {ingredient.unit})
                                  </li>
                                )
                              );
                            })}
                        </ul>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-gray-300 text-gray-800 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {currentIngredient?.id
                ? "Masalliqni tahrirlash"
                : "Yangi masalliq qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nomi
              </Label>
              <Input
                id="name"
                placeholder="Masalliq nomi"
                value={currentIngredient?.name || ""}
                onChange={(e) =>
                  setCurrentIngredient({
                    ...currentIngredient,
                    name: e.target.value,
                  })
                }
                className="col-span-3 bg-gray-100 border-gray-300 text-gray-800"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stock_quantity" className="text-right">
                Miqdori
              </Label>
              <Input
                id="stock_quantity"
                type="number"
                placeholder="Miqdor"
                value={formatQuantity(currentIngredient?.stock_quantity, currentIngredient?.unit)}
                onChange={(e) =>
                  setCurrentIngredient({
                    ...currentIngredient,
                    stock_quantity: Number(e.target.value),
                  })
                }
                className="col-span-2 bg-gray-100 border-gray-300 text-gray-800"
                min="0"
                step={currentIngredient?.unit === 'dona' ? "1" : "0.1"} // Birlikga qarab step
              />
              <Select
                value={currentIngredient?.unit || "dona"}
                onValueChange={(value) =>
                  setCurrentIngredient({ ...currentIngredient, unit: value })
                }
              >
                <SelectTrigger className="col-span-1 bg-gray-100 border-gray-300 text-gray-800">
                  <SelectValue placeholder="Birlik" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="dona">dona</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="l">l</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentIngredient?.id && ( // Faqat mavjud masalliqni tahrirlashda ko'rsatiladi
              <div className="space-y-2 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <LinkIcon className="h-5 w-5" /> Ushbu masalliqdan
                  foydalanadigan mahsulotlar
                </h3>
                <p className="text-sm text-gray-600">
                  Bu masalliq ishlatiladigan mahsulotlar ro'yxati. Kerakli
                  miqdorni mahsulotni tahrirlash bo'limidan o'zgartirishingiz
                  mumkin.
                </p>
                <div className="grid gap-3">
                  {linkedProductsForEdit.length === 0 ? (
                    <p className="text-gray-500 italic">
                      Hech qanday mahsulotga bog'lanmagan.
                    </p>
                  ) : (
                    linkedProductsForEdit.map((link) => (
                      <div
                        key={link.product_id}
                        className="flex items-center justify-between gap-4 p-2 border border-gray-200 rounded-md bg-gray-50"
                      >
                        <Label
                          htmlFor={`linked-product-${link.product_id}`}
                          className="text-gray-700"
                        >
                          {link.product_name}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id={`linked-product-${link.product_id}`}
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={formatQuantity(link.quantity_needed, currentIngredient?.unit)}
                            readOnly // Faqat o'qish uchun
                            className="w-24 bg-white border-gray-300 text-gray-800"
                          />
                          <span className="text-gray-600">
                            {currentIngredient?.unit || "dona"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
              onClick={handleSaveIngredient}
              disabled={isSaving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {isSaving ? "Saqlanmoqda..." : "Saqlash"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminIngredients;