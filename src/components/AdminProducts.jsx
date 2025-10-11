import React, { useState, memo, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  X,
  Salad,
  Search,
  Check,
  Filter, // Filter iconini import qilish
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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
import { calculateProductStock } from "@/utils/stockCalculator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn, formatQuantity, formatPrice } from "@/lib/utils"; // formatQuantity va formatPrice import qilindi
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Checkbox import qilindi

const AdminProducts = memo(
  ({ products, allIngredients, allProductIngredients }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // State for ingredient selection
    const [selectedProductIngredients, setSelectedProductIngredients] =
      useState([]); // { ingredient_id, quantity_needed, name, unit }
    const [isIngredientsSelectOpen, setIsIngredientsSelectOpen] =
      useState(false);
    const [ingredientSearchTerm, setIngredientSearchTerm] = useState("");

    // Yangi: Kategoriya filtri holati
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
      if (!isDialogOpen) {
        setCurrentProduct(null);
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedProductIngredients([]);
        setIngredientSearchTerm("");
      }
    }, [isDialogOpen]);

    const openDialog = (product = null) => {
      setCurrentProduct(
        product || {
          name: "",
          description: "",
          price: "",
          image_url: "",
          category: "",
          manual_stock_enabled: false, // Yangi holat
          manual_stock_quantity: 0, // Yangi holat
        }
      );
      setSelectedImage(null);
      setImagePreview(product?.image_url || null);

      if (product) {
        // Load existing product_ingredients for this product
        const existingProductIngredients = allProductIngredients
          .filter((pi) => pi.product_id === product.id)
          .map((pi) => {
            const ingredient = allIngredients.find(
              (ing) => ing.id === pi.ingredient_id
            );
            return {
              ingredient_id: pi.ingredient_id,
              quantity_needed: pi.quantity_needed,
              name: ingredient ? ingredient.name : "Noma'lum masalliq",
              unit: ingredient ? ingredient.unit : "dona",
            };
          });
        setSelectedProductIngredients(existingProductIngredients);
      } else {
        setSelectedProductIngredients([]);
      }
      setIsDialogOpen(true);
    };

    const handleImageSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Xatolik",
            description: "Rasm hajmi 5MB dan oshmasligi kerak.",
            variant: "destructive",
          });
          return;
        }
        setSelectedImage(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };

    const uploadImage = async (file) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(filePath);

      return publicUrl;
    };

    const handleSave = async () => {
      if (!currentProduct.name || !currentProduct.price) {
        toast({
          title: "Xatolik",
          description: "Nom va narxni kiritish majburiy.",
          variant: "destructive",
        });
        return;
      }

      if (currentProduct.manual_stock_enabled) {
        if (
          currentProduct.manual_stock_quantity === null ||
          currentProduct.manual_stock_quantity < 0
        ) {
          toast({
            title: "Xatolik",
            description: "Qo'lda kiritilgan stok miqdori 0 dan kam bo'lishi mumkin emas.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Check if any ingredient is selected and has quantity_needed > 0
        if (
          selectedProductIngredients.length > 0 &&
          selectedProductIngredients.some((pi) => pi.quantity_needed <= 0)
        ) {
          toast({
            title: "Xatolik",
            description:
              "Masalliqlar uchun kerakli miqdor 0 dan katta bo'lishi kerak.",
            variant: "destructive",
          });
          return;
        }

        // New validation: Check if quantity_needed is an integer for "dona" unit
        for (const pi of selectedProductIngredients) {
          const ingredient = allIngredients.find(
            (ing) => ing.id === pi.ingredient_id
          );
          if (
            ingredient &&
            ingredient.unit === "dona" &&
            !Number.isInteger(pi.quantity_needed)
          ) {
            toast({
              title: "Xatolik",
              description: `'${ingredient.name}' masallig'i uchun faqat butun sonlar (1, 2, va hokazo) kiritish mumkin. O'nlik sonlar (1.2, 3.5) mumkin emas.`,
              variant: "destructive",
            });
            setIsSaving(false);
            setIsUploading(false);
            return;
          }
        }

        // Existing check: Ensure selected quantity needed does not exceed available ingredient stock
        for (const pi of selectedProductIngredients) {
          const ingredient = allIngredients.find(
            (ing) => ing.id === pi.ingredient_id
          );
          if (
            ingredient &&
            pi.quantity_needed > (ingredient.stock_quantity ?? 0)
          ) {
            toast({
              title: "Xatolik",
              description: `${
                ingredient.name
              } masallig'ining yetarli zaxirasi yo'q. Mavjud: ${
                ingredient.stock_quantity ?? 0
              } ${ingredient.unit}.`,
              variant: "destructive",
            });
            setIsSaving(false);
            setIsUploading(false);
            return;
          }
        }
      }

      setIsSaving(true);
      setIsUploading(true);

      try {
        let imageUrl =
          currentProduct.image_url ||
          "https://images.unsplash.com/photo-1559223669-e0065fa7f142";

        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage);
        }

        const productData = {
          name: currentProduct.name,
          description: currentProduct.description,
          price: Number(currentProduct.price),
          image_url: imageUrl,
          category: currentProduct.category || null,
          manual_stock_enabled: currentProduct.manual_stock_enabled, // Yangi maydon
          manual_stock_quantity: currentProduct.manual_stock_enabled
            ? Number(currentProduct.manual_stock_quantity)
            : null, // Yangi maydon
        };

        let error;
        let productId;

        if (currentProduct.id) {
          const { error: updateError } = await supabase
            .from("products")
            .update(productData)
            .eq("id", currentProduct.id);
          error = updateError;
          productId = currentProduct.id;
        } else {
          const { data, error: insertError } = await supabase
            .from("products")
            .insert([productData])
            .select("id")
            .single();
          error = insertError;
          productId = data?.id;
        }

        if (error) throw error;

        // Update product_ingredients table
        if (productId) {
          // Delete existing links for this product
          await supabase
            .from("product_ingredients")
            .delete()
            .eq("product_id", productId);

          // Insert new links ONLY if manual stock is NOT enabled
          if (!currentProduct.manual_stock_enabled && selectedProductIngredients.length > 0) {
            const newProductIngredients = selectedProductIngredients.map(
              (pi) => ({
                product_id: productId,
                ingredient_id: pi.ingredient_id,
                quantity_needed: pi.quantity_needed,
              })
            );
            const { error: piError } = await supabase
              .from("product_ingredients")
              .insert(newProductIngredients);
            if (piError) throw piError;
          }
        }

        toast({
          title: "Muvaffaqiyatli!",
          description: `Mahsulot muvaffaqiyatli saqlandi.`,
        });
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Save error:", error);
        toast({
          title: "Xatolik",
          description:
            error.message || "Mahsulotni saqlashda xatolik yuz berdi.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
        setIsUploading(false);
      }
    };

    const handleDelete = async (productId) => {
      try {
        // Delete associated product_ingredients first
        await supabase
          .from("product_ingredients")
          .delete()
          .eq("product_id", productId);

        // Then delete the product
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", productId);

        if (error) throw error;

        toast({
          title: "Muvaffaqiyatli!",
          description: "Mahsulot o'chirildi.",
        });
      } catch (error) {
        console.error("Mahsulotni o'chirishda xatolik:", error);
        toast({
          title: "Xatolik",
          description: error.message || "Mahsulotni o'chirishda xatolik.",
          variant: "destructive",
        });
      }
    };

    const handleSelectIngredient = (ingredient) => {
      setSelectedProductIngredients((prev) => {
        const exists = prev.some((pi) => pi.ingredient_id === ingredient.id);
        if (exists) {
          return prev.filter((pi) => pi.ingredient_id !== ingredient.id);
        } else {
          return [
            ...prev,
            {
              ingredient_id: ingredient.id,
              quantity_needed: 1, // Default quantity
              name: ingredient.name,
              unit: ingredient.unit,
            },
          ];
        }
      });
      setIngredientSearchTerm(""); // Clear search after selection
      setIsIngredientsSelectOpen(false); // Close popover after selection
    };

    const handleQuantityNeededChange = (ingredientId, value) => {
      setSelectedProductIngredients((prev) =>
        prev.map((pi) =>
          pi.ingredient_id === ingredientId
            ? { ...pi, quantity_needed: Number(value) }
            : pi
        )
      );
    };

    const filteredAvailableIngredients = useMemo(() => {
      const selectedIds = new Set(
        selectedProductIngredients.map((pi) => pi.ingredient_id)
      );
      return allIngredients.filter(
        (ingredient) =>
          !selectedIds.has(ingredient.id) &&
          ingredient.name
            .toLowerCase()
            .includes(ingredientSearchTerm.toLowerCase())
      );
    }, [allIngredients, selectedProductIngredients, ingredientSearchTerm]);

    // Yangi: Mahsulotlarni kategoriya bo'yicha filtrlash
    const filteredProducts = useMemo(() => {
      if (categoryFilter === "all") {
        return products;
      }
      return products.filter((product) => product.category === categoryFilter);
    }, [products, categoryFilter]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold text-white">Mahsulotlar</h1>
          <Button
            onClick={() => openDialog()}
            className="bg-gradient-to-r from-orange-500 to-red-500"
          >
            <Plus className="mr-2 h-4 w-4" /> Yangi mahsulot
          </Button>
        </div>

        {/* Yangi: Kategoriya filtri */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Kategoriya" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="all" className="text-white">
                Hammasi
              </SelectItem>
              <SelectItem value="Hoddog" className="text-white">
                Hoddog
              </SelectItem>
              <SelectItem value="Ichimliklar" className="text-white">
                Ichimliklar
              </SelectItem>
              <SelectItem value="Disertlar" className="text-white">
                Disertlar
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredProducts.length === 0 ? (
              <Card className="bg-white/10 border-gray-600">
                <CardContent className="p-8 text-center">
                  <p className="text-gray-600 text-lg">
                    Hozircha mahsulotlar yo'q.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredProducts.map((product) => {
                const displayedStock = product.manual_stock_enabled
                  ? product.manual_stock_quantity
                  : calculateProductStock(
                      product.id,
                      products,
                      allIngredients,
                      allProductIngredients
                    );
                const isOutOfStock = displayedStock === 0;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Card className="bg-white/10 border-gray-500 rounded-[0.5rem] h-full flex flex-col">
                      <CardHeader>
                        <CardTitle className="text-gray-800 flex justify-between items-start">
                          <span className="flex-1 text-xl mr-4 text-white/90">
                            {product.name}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-200 hover:bg-gray-200 rounded-[0.3rem]"
                              onClick={() => openDialog(product)}
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
                                    "{product.name}" mahsulotini o'chirishga
                                    ishonchingiz komilmi? Bu amalni orqaga
                                    qaytarib bo'lmaydi.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-gray-800 border-gray-300 hover:bg-gray-200">
                                    Bekor qilish
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(product.id)}
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
                      <CardContent className="flex-grow">
                        {product.category && (
                          <div className="mb-2">
                            <span className="text-gray-200 font-bold">
                              Kategoriya:
                            </span>
                            <span className="text-[1rem] font-semibold px-2 py-1 text-orange-400">
                              {product.category}
                            </span>
                          </div>
                        )}
                        <p className="text-gray-200 my-2">
                          <span className="text-gray-200 font-bold">
                            Tavsifi:{" "}
                          </span>
                          {product.description}
                        </p>
                        <p className="text-white/80 font-bold text-lg">
                          <span className="text-gray-200 font-bold">
                            Narxi:{" "}
                          </span>
                          {formatPrice(product.price)} so'm
                        </p>
                        <div className="mt-2">
                          <span className="text-gray-200 font-bold">
                            Soni:{" "}
                          </span>
                          <span
                            className={`text-sm font-medium px-2 py-1 rounded ${
                              displayedStock > 10
                                ? "bg-green-100 text-green-600"
                                : displayedStock > 5
                                ? "bg-orange-100 text-orange-600"
                                : displayedStock > 0
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {displayedStock > 0
                              ? `${displayedStock} ta qoldi`
                              : "Tugadi"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-white border-gray-300 text-gray-800 sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gray-800">
                {currentProduct?.id
                  ? "Mahsulotni tahrirlash"
                  : "Yangi mahsulot qo'shish"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nomi
                </Label>
                <Input
                  id="name"
                  placeholder="Mahsulot nomi"
                  value={currentProduct?.name || ""}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      name: e.target.value,
                    })
                  }
                  className="col-span-3 bg-gray-100 border-gray-300 text-gray-800"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Tavsifi
                </Label>
                <Textarea
                  id="description"
                  placeholder="Mahsulot tavsifi"
                  value={currentProduct?.description || ""}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3 bg-gray-100 border-gray-300 text-gray-800"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Narxi
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Narxi"
                  value={formatPrice(currentProduct?.price)}
                  onChange={(e) =>
                    setCurrentProduct({
                      ...currentProduct,
                      price: Number(e.target.value),
                    })
                  }
                  className="col-span-3 bg-gray-100 border-gray-300 text-gray-800"
                  step="0.01" // Narx uchun 2 o'nlik kasrga ruxsat berish
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Kategoriya
                </Label>
                <Select
                  value={currentProduct?.category || ""}
                  onValueChange={(value) =>
                    setCurrentProduct({
                      ...currentProduct,
                      category: value,
                    })
                  }
                >
                  <SelectTrigger className="col-span-3 bg-gray-100 border-gray-300 text-gray-800">
                    <SelectValue placeholder="Kategoriya tanlang" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="Hoddog">Hoddog</SelectItem>
                    <SelectItem value="Ichimliklar">Ichimliklar</SelectItem>
                    <SelectItem value="Disertlar">Disertlar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-800 text-sm font-medium">
                  Mahsulot rasmi
                </Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                      <Upload className="h-4 w-4 text-gray-800" />{" "}
                      <span className="text-gray-800 text-sm">
                        {" "}
                        {selectedImage ? selectedImage.name : "Rasm tanlash"}
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300">
                      {" "}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    // first commit
                  )}
                </div>
              </div>

              {/* Yangi: Qo'lda stok kiritish checkboxi */}
              <div className="flex items-center space-x-2 mt-6">
                <Checkbox
                  id="manual-stock"
                  checked={currentProduct?.manual_stock_enabled || false}
                  onCheckedChange={(checked) =>
                    setCurrentProduct((prev) => ({
                      ...prev,
                      manual_stock_enabled: checked,
                      manual_stock_quantity: checked ? prev?.manual_stock_quantity || 0 : null, // Agar o'chirilgan bo'lsa, miqdorni tozalash
                    }))
                  }
                />
                <Label htmlFor="manual-stock" className="text-gray-800">
                  Qo'lda stok kiritish
                </Label>
              </div>

              {/* Yangi: Qo'lda stok kiritish inputi */}
              {currentProduct?.manual_stock_enabled && (
                <div className="grid grid-cols-4 items-center gap-4 mt-4">
                  <Label htmlFor="manual_stock_quantity" className="text-right">
                    Stok miqdori
                  </Label>
                  <Input
                    id="manual_stock_quantity"
                    type="number"
                    placeholder="Stok miqdori"
                    value={currentProduct?.manual_stock_quantity || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        manual_stock_quantity: Number(e.target.value),
                      })
                    }
                    className="col-span-3 bg-gray-100 border-gray-300 text-gray-800"
                    min="0"
                    step="1"
                  />
                </div>
              )}

              {/* Ishlatiladigan masalliqlar bo'limi - faqat qo'lda stok kiritish yoqilmagan bo'lsa ko'rsatiladi */}
              {!currentProduct?.manual_stock_enabled && (
                <div className="space-y-2 mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Salad className="h-5 w-5" /> Ishlatiladigan masalliqlar
                  </h3>
                  <p className="text-sm text-gray-600">
                    Bu mahsulotni tayyorlash uchun kerak bo'ladigan masalliqlarni
                    tanlang va har biri uchun miqdorini kiriting.
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedProductIngredients.map((pi) => (
                      <Badge
                        key={pi.ingredient_id}
                        variant="secondary"
                        className="flex items-center gap-2 p-2 pr-1 bg-orange-100 border border-orange-300 text-orange-700"
                      >
                        <span>{pi.name}</span>
                        <Input
                          type="number"
                          min="0.1"
                          step={pi.unit === "dona" ? "1" : "0.1"}
                          value={formatQuantity(pi.quantity_needed, pi.unit)}
                          onChange={(e) =>
                            handleQuantityNeededChange(
                              pi.ingredient_id,
                              e.target.value
                            )
                          }
                          // Increment/decrement tugmalarini va klaviatura o'qlarini o'chirish
                          onKeyDown={(e) => {
                            if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                              e.preventDefault();
                            }
                          }}
                          onWheel={(e) => e.currentTarget.blur()} // Scroll bilan o'zgarishni o'chirish
                          className="w-20 h-7 p-1 text-center bg-white border-orange-200 text-gray-800 no-spinners"
                        />
                        <span className="text-sm">{pi.unit}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-100"
                          onClick={() =>
                            setSelectedProductIngredients((prev) =>
                              prev.filter(
                                (item) => item.ingredient_id !== pi.ingredient_id
                              )
                            )
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  <Popover
                    open={isIngredientsSelectOpen}
                    onOpenChange={setIsIngredientsSelectOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isIngredientsSelectOpen}
                        className="w-full justify-between bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200"
                      >
                        Masalliq tanlash...
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border-gray-300">
                      <Command>
                        <CommandInput
                          placeholder="Masalliq qidirish..."
                          value={ingredientSearchTerm}
                          onValueChange={setIngredientSearchTerm}
                          className="h-9"
                        />
                        <CommandEmpty>Masalliq topilmadi.</CommandEmpty>
                        <CommandGroup>
                          {filteredAvailableIngredients.map((ingredient) => (
                            <CommandItem
                              key={ingredient.id}
                              value={ingredient.name}
                              onSelect={() => handleSelectIngredient(ingredient)}
                              className={cn("flex items-center justify-between")}
                            >
                              <div className="flex items-center gap-2">
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedProductIngredients.some(
                                      (pi) => pi.ingredient_id === ingredient.id
                                    )
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {ingredient.name}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                  {" "}
                  Bekor qilish
                </Button>
              </DialogClose>
              <Button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {" "}
                {isUploading
                  ? "Yuklanyapti..."
                  : isSaving
                  ? "Saqlanmoqda..."
                  : "Saqlash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

export default AdminProducts;