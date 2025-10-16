import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // AnimatePresence import qilindi
import { ArrowLeft, ShoppingCart, Plus, Minus, Check, Salad, Settings } from "lucide-react"; // Check va Salad iconlarini import qilish
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useWindowSize } from "react-use";
import { supabase } from "@/lib/supabase";
import { calculateProductStock } from "@/utils/stockCalculator"; // Import stock calculator
import { formatPrice, formatQuantity } from "@/lib/utils"; // formatPrice va formatQuantity import qilindi
import ClientCustomizationDialog from "./ClientCustomizationDialog"; // Yangi: ClientCustomizationDialog import qilindi

const ProductDetail = ({ onAddToCart, products, ingredients, productIngredients, cartItems }) => {
  const { slug } = useParams(); // ID o'rniga slug ni olamiz
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [calculatedStock, setCalculatedStock] = useState(0); // Yangi holat
  const [isAdding, setIsAdding] = useState(false); // Yangi holat: animatsiya uchun

  // Yangi: Moslashtirish dialogi holati
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [currentCustomizations, setCurrentCustomizations] = useState({}); // { ingredient_id: custom_quantity }

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug) // ID o'rniga slug orqali qidiramiz
        .single();

      if (error) {
        toast({
          title: "Xatolik!",
          description: "Mahsulot topilmadi",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setProduct(data);
      // Mahsulot yuklangandan so'ng stokni hisoblash
      const stock = data.manual_stock_enabled
        ? data.manual_stock_quantity
        : calculateProductStock(data.id, products, ingredients, productIngredients);
      setCalculatedStock(stock);
      setLoading(false);
    };

    fetchProduct();

    const channel = supabase
      .channel(`product-${slug}`) // Kanal nomini slug bilan bog'lash
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `slug=eq.${slug}`, // Filter ham slug bo'yicha
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            navigate("/");
          } else {
            setProduct(payload.new);
            // Realtime yangilanishda ham stokni qayta hisoblash
            const stock = payload.new.manual_stock_enabled
              ? payload.new.manual_stock_quantity
              : calculateProductStock(payload.new.id, products, ingredients, productIngredients);
            setCalculatedStock(stock);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slug, navigate, products, ingredients, productIngredients]); // Dependency arrayga slug qo'shildi

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        {" "}
        <div className="text-gray-800 text-xl">Yuklanmoqda...</div>{" "}
      </div>
    );
  }

  if (!product) return null;

  // Savatda allaqachon mavjud bo'lgan miqdorni hisoblash
  const quantityInCart = cartItems.find(item => item.id === product.id)?.quantity || 0;

  // Haqiqiy mavjud stok (umumiy stok - savatdagi miqdor)
  const effectiveStock = calculatedStock - quantityInCart;

  const isOutOfStock = effectiveStock <= 0;

  const handleAddToCart = () => {
    if (quantity > effectiveStock) {
      toast({
        title: "Xatolik!",
        description: `Faqat ${effectiveStock} ta qo'shishingiz mumkin.`,
        variant: "destructive",
      });
      return;
    }
    if (quantity === 0) {
      toast({
        title: "Xatolik!",
        description: `Mahsulot miqdori 0 bo'lishi mumkin emas.`,
        variant: "destructive",
      });
      return;
    }

    onAddToCart({ ...product, quantity, customizations: currentCustomizations, ingredients: ingredientsForProduct }); // Moslashtirishlarni va masalliqlarni ham qo'shish
    setIsAdding(true); // Animatsiyani boshlash
    setTimeout(() => {
      setIsAdding(false); // Animatsiyani tugatish
    }, 1000); // 1 soniyadan keyin asl holatiga qaytadi

    toast({
      title: "Savatga qo'shildi!",
      description: `${product.name} (${quantity} dona) savatga qo'shildi`,
    });
  };

  const incrementQuantity = () => {
    if (quantity < effectiveStock) {
      setQuantity((prev) => prev + 1);
    } else {
      toast({
        title: "Xatolik!",
        description: `Faqat ${effectiveStock} ta qo'shishingiz mumkin.`,
        variant: "destructive",
      });
    }
  };

  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  // Mahsulotga bog'langan masalliqlarni topish
  const productIngredientsData = productIngredients.filter((pi) => pi.product_id === product.id);

  const ingredientsForProduct = product.manual_stock_enabled
    ? [] // Agar qo'lda stok kiritish yoqilgan bo'lsa, masalliqlarni ko'rsatmaymiz
    : productIngredientsData
        .map((pi) => {
          const ingredient = ingredients.find((ing) => ing.id === pi.ingredient_id);
          return ingredient ? { ...ingredient, quantity_needed: pi.quantity_needed, is_customizable: pi.is_customizable } : null;
        })
        .filter(Boolean); // null qiymatlarni olib tashlash

  const customizableIngredients = ingredientsForProduct.filter(ing => ing.is_customizable);

  const handleSaveCustomizations = (newCustomizations) => {
    setCurrentCustomizations(newCustomizations);
  };

  return (
    <div className="min-h-screen bg-[#eaeaea]">
      {" "}
      {/* Fon rangi yangilandi */}
      <div className="container mx-auto px-4 sm:px-2 lg:px-8 py-2 sm:py-3">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-800 mb-2 bg-white hover:bg-white/80 border border-black/10 shadow-md rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/90 border border-black/20 rounded-2xl shadow-inner">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 sm:p-6 lg:p-10">
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 shadow-md">
                  <img
                    className="w-full h-full object-cover"
                    alt={product.name}
                    src={
                      product.image_url ||
                      "https://images.unsplash.com/photo-1559223669-e0065fa7f142"
                    }
                  />
                </div>

                <div className="flex flex-col justify-start space-y-6">
                  <div>
                    <h1 className="text-2xl big_tablet:text-[1.2rem] laptop:text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2 leading-tight">
                      {" "}
                      {product.name}
                    </h1>
                    {product.category && (
                      <div className="mb-3 big_tablet:text-[.94rem] flex items-center justify-start gap-2">
                        <p>Kategoriya:</p>
                        <span className="inline-block big_tablet:text-[.9rem] text-xs sm:text-sm font-semibold px-3 py-1 laptop:text-[0.9rem] rounded bg-gray-200 shadow-lg  text-gray-800 border border-gray-300">
                          {" "}
                          {product.category}
                        </span>
                      </div>
                    )}
                    <p className="text-gray-600 text-base sm:text-lg mb-6 leading-relaxed big_tablet:text-[.96rem]">
                      {" "}
                      {/* Matn rangi yangilandi */}
                      {product.description}
                    </p>

                    {/* Yangi: Masalliqlar bo'limi - faqat "Ichimliklar" kategoriyasi bo'lmaganda ko'rsatiladi */}
                    {ingredientsForProduct.length > 0 && product.category !== "Ichimliklar" && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
                          <Salad className="h-5 w-5 text-green-600" /> Masalliqlar:
                        </h3>
                        <ul className="flex flex-wrap gap-2">
                          {ingredientsForProduct.map((ingredient, index) => (
                            <li key={index} className="text-gray-700 text-sm bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                              {ingredient.name} ({formatQuantity(ingredient.quantity_needed, ingredient.unit)} {ingredient.unit})
                            </li>
                          ))}
                        </ul>
                        {customizableIngredients.length > 0 && (
                          <Button
                            variant="outline"
                            className="mt-4 text-gray-800 border-gray-300 hover:bg-gray-200"
                            onClick={() => setIsCustomizationDialogOpen(true)}
                          >
                            <Settings className="mr-2 h-4 w-4" /> Masalliqlarni moslashtirish
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="mb-6">
                      <span
                        className={`text-sm font-semibold px-3 py-2 rounded ${
                          effectiveStock > 10
                            ? "bg-green-100 text-green-600" /* Ranglar yangilandi */
                            : effectiveStock > 5
                            ? "bg-orange-100 text-orange-600" /* Ranglar yangilandi */
                            : effectiveStock > 0
                            ? "bg-red-100 text-red-600" /* Ranglar yangilandi */
                            : "bg-gray-100 text-gray-600" /* Ranglar yangilandi */
                        }`}
                      >
                        {effectiveStock > 0
                          ? `${effectiveStock} ta qoldi - ulgurib qoling`
                          : "Qolmagan"}
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-500 big_tablet:text-[1.4rem]">
                        {" "}
                        {/* Matn rangi yangilandi */}
                        {formatPrice(product.price)} so'm
                      </span>
                    </div>
                  </div>

                  {/* Quantity + Add to Cart */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-gray-800 font-medium">Miqdor:</span>{" "}
                      {/* Matn rangi yangilandi */}
                      <div className="flex items-center gap-2 big_tablet:gap-0 bg-gray-200/40 rounded-lg px-2">
                        {" "}
                        {/* Rang yangilandi */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={decrementQuantity}
                          disabled={isOutOfStock}
                          className="h-10 w-10 big_tablet:h-5 p-0 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="text-gray-800 big_tablet:text-[.94rem] font-bold text-xl w-12 text-center">
                          {quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={incrementQuantity}
                          disabled={isOutOfStock || quantity >= effectiveStock}
                          className="h-10 w-10 p-0 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={
                        isOutOfStock || quantity > effectiveStock || quantity === 0 || isAdding
                      }
                      className="w-full h-12 big_tablet:text-[.94rem] big_tablet:h-10 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <AnimatePresence mode="wait">
                        {isAdding ? (
                          <motion.span
                            key="added"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center justify-center"
                          >
                            <Check className="mr-2 h-5 w-5" /> Qo'shildi!
                          </motion.span>
                        ) : (
                          <motion.span
                            key="add-to-cart"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center justify-center"
                          >
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            {isOutOfStock ? "Tugadi" : "Savatga qo'shish"}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <ClientCustomizationDialog
        isOpen={isCustomizationDialogOpen}
        onClose={() => setIsCustomizationDialogOpen(false)}
        productName={product.name}
        customizableIngredients={customizableIngredients}
        initialCustomizations={currentCustomizations}
        onSaveCustomizations={handleSaveCustomizations}
      />
    </div>
  );
};

export default ProductDetail;