import React, { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
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

const AdminProducts = memo(({ products }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const openDialog = (product = null) => {
    setCurrentProduct(
      product || {
        name: "",
        description: "",
        price: "",
        image_url: "",
        stock: 0,
        category: "",
      }
    );
    setSelectedImage(null);
    setImagePreview(product?.image_url || null);
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
    setIsSaving(true);
    setIsUploading(true);

    try {
      let imageUrl =
        currentProduct.image_url ||
        "https://images.unsplash.com/photo-1559223669-e0065fa7f142";

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      // Cache-Control Header for uploaded images
      const response = await fetch(imageUrl);
      if (response.ok) {
        const cacheControlHeader = response.headers.get("cache-control");
        if (!cacheControlHeader.includes("no-cache")) {
          console.warn(
            "Cache policy might need adjustment for dynamic content."
          );
        }
      }

      const productData = {
        name: currentProduct.name,
        description: currentProduct.description,
        price: Number(currentProduct.price),
        image_url: imageUrl,
        stock: Number(currentProduct.stock),
        category: currentProduct.category || null,
      };

      let error;
      if (currentProduct.id) {
        const { error: updateError } = await supabase
          .from("products")
          .update(productData)
          .eq("id", currentProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert([productData]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli!",
        description: `Mahsulot muvaffaqiyatli saqlandi.`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Xatolik",
        description: error.message || "Mahsulotni saqlashda xatolik yuz berdi.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (productId) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) {
      toast({
        title: "Xatolik",
        description: "Mahsulotni o'chirishda xatolik.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Muvaffaqiyatli!", description: "Mahsulot o'chirildi." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Mahsulotlar</h1>
        <Button
          onClick={() => openDialog()}
          className="bg-gradient-to-r from-orange-500 to-red-500"
        >
          <Plus className="mr-2 h-4 w-4" /> Yangi mahsulot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Card className="bg-white border-gray-300 h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-gray-800 flex justify-between items-start">
                    <span className="flex-1 mr-4">{product.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-800 hover:bg-gray-200"
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
                              ishonchingiz komilmi? Bu amalni orqaga qaytarib
                              bo'lmaydi.
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
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-800 border border-gray-300">
                        {product.category}
                      </span>
                    </div>
                  )}
                  <p className="text-gray-600 mb-2">{product.description}</p>
                  <p className="text-orange-500 font-bold text-lg">
                    {Number(product.price).toLocaleString()} so'm
                  </p>
                  <div className="mt-2">
                    <span
                      className={`text-sm font-medium px-2 py-1 rounded ${
                        product.stock > 10
                          ? "bg-green-100 text-green-600" /* Ranglar yangilandi */
                          : product.stock > 5
                          ? "bg-orange-100 text-orange-600" /* Ranglar yangilandi */
                          : product.stock > 0
                          ? "bg-red-100 text-red-600" /* Ranglar yangilandi */
                          : "bg-gray-100 text-gray-600" /* Ranglar yangilandi */
                      }`}
                    >
                      {product.stock > 0
                        ? `${product.stock} ta qoldi`
                        : "Tugadi"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-gray-300 text-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-800">
              {currentProduct?.id
                ? "Mahsulotni tahrirlash"
                : "Yangi mahsulot qo'shish"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nomi"
              value={currentProduct?.name || ""}
              onChange={(e) =>
                setCurrentProduct({ ...currentProduct, name: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
            />
            <Textarea
              placeholder="Tavsifi"
              value={currentProduct?.description || ""}
              onChange={(e) =>
                setCurrentProduct({
                  ...currentProduct,
                  description: e.target.value,
                })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
            />
            <Input
              type="number"
              placeholder="Narxi"
              value={currentProduct?.price || ""}
              onChange={(e) =>
                setCurrentProduct({ ...currentProduct, price: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
            />
            <Input
              type="number"
              placeholder="Miqdori (stock)"
              value={currentProduct?.stock ?? ""}
              onChange={(e) =>
                setCurrentProduct({ ...currentProduct, stock: e.target.value })
              }
              className="bg-gray-100 border-gray-300 text-gray-800"
              min="0"
            />

            <div className="space-y-2">
              <label className="text-gray-800 text-sm font-medium">
                Kategoriya
              </label>
              <select
                value={currentProduct?.category || ""}
                onChange={(e) =>
                  setCurrentProduct({
                    ...currentProduct,
                    category: e.target.value,
                  })
                }
                className="w-full bg-gray-100 border border-gray-300 text-gray-800 rounded-md px-3 py-2 focus:outline-none"
              >
                <option value="" className="bg-white">
                  Tanlang
                </option>
                <option value="Hoddog" className="bg-white">
                  Hoddog
                </option>
                <option value="Ichimlillar" className="bg-white">
                  Ichimlillar
                </option>
                <option value="Disertlar" className="bg-white">
                  Disertlar
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-gray-800 text-sm font-medium">
                Mahsulot rasmi
              </label>
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
                )}
              </div>
            </div>
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
});

export default AdminProducts;
