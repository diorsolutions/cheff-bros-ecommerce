import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // AnimatePresence import qilindi
import { ArrowLeft, ShoppingCart, Plus, Minus, Check } from "lucide-react"; // Check iconini import qilish
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useWindowSize } from "react-use";
import { supabase } from "@/lib/supabase";
import { calculateProductStock } from "@/utils/stockCalculator"; // Import stock calculator

const ProductDetail = ({ onAddToCart, products, ingredients, productIngredients }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [calculatedStock, setCalculatedStock] = useState(0); // Yangi holat
  const [isAdding, setIsAdding] = useState(false); // Yangi holat: animatsiya uchun

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
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
      const stock = calculateProductStock(data.id, products, ingredients, productIngredients);
      setCalculatedStock(stock);
      setLoading(false);
    };

    fetchProduct();

    const channel = supabase
      .channel(`product-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            navigate("/");
          } else {
            setProduct(payload.new);
            // Realtime yangilanishda ham stokni qayta hisoblash
            const stock = calculateProductStock(payload.new.id, products, ingredients, productIngredients);
            setCalculatedStock(stock);
          }
        }
      )
      .subscribe();

    // Ingredients va productIngredients o'zgarganda ham stokni qayta hisoblash
    const ingredientChannel = supabase
      .channel(`ingredient-changes-for-product-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ingredients" },
        (payload) => {
          if (product) {
            const stock = calculateProductStock(product.id, products, ingredients, productIngredients);
            setCalculatedStock(stock);
          }
        }
      )
      .subscribe();

    const productIngredientChannel = supabase
      .channel(`product_ingredient-changes-for-product-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "product_ingredients", filter: `product_id=eq.${id}` },
        (payload) => {
          if (product) {
            const stock = calculateProductStock(product.id, products, ingredients, productIngredients);
            setCalculatedStock(stock);
          }
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(ingredientChannel);
      supabase.removeChannel(productIngredientChannel);
    };
  }, [id, navigate, products, ingredients, productIngredients, product]); // product ham dependency ga qo'shildi

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        {" "}
        <div className="text-gray-800 text-xl">Yuklanmoqda...</div>{" "}
      </div>
    );
  }

  if (!product) return null;

  const isOutOfStock = calculatedStock === 0;

  const handleAddToCart = () => {
    if (quantity > calculatedStock) { // calculatedStock ishlatildi
      toast({
        title: "Xatolik!",
        description: `Faqat ${calculatedStock} ta mavjud`,
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

    onAddToCart({ ...product, quantity });
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
    if (quantity < calculatedStock) { // calculatedStock ishlatildi
      setQuantity((prev) => prev + 1);
    } else {
      toast({
        title: "Xatolik!",
        description: `Faqat ${calculatedStock} ta mavjud`,
        variant: "destructive",
      });
    }
  };

  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  return (
    <div className="min-h-screen bg-[#eaeaea]">
      {" "}
      {/* Fon rangi yangilandi */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-800 mb-6 bg-white hover:bg-gray-200 border border-black/10 shadow-lg rounded-xl"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/90 border border-black/20 rounded-2xl shadow-lg">
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

                    <div className="mb-6">
                      <span
                        className={`text-sm font-semibold px-3 py-2 rounded ${
                          calculatedStock > 10 // calculatedStock ishlatildi
                            ? "bg-green-100 text-green-600" /* Ranglar yangilandi */
                            : calculatedStock > 5
                            ? "bg-orange-100 text-orange-600" /* Ranglar yangilandi */
                            : calculatedStock > 0
                            ? "bg-red-100 text-red-600" /* Ranglar yangilandi */
                            : "bg-gray-100 text-gray-600" /* Ranglar yangilandi */
                        }`}
                      >
                        {calculatedStock > 0
                          ? `${calculatedStock} ta qoldi - ulgurib qoling`
                          : "Qolmagan"}
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-500 big_tablet:text-[1.4rem]">
                        {" "}
                        {/* Matn rangi yangilandi */}
                        {Number(product.price).toLocaleString()} so'm
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
                          disabled={isOutOfStock || quantity >= calculatedStock} // calculatedStock ishlatildi
                          className="h-10 w-10 p-0 text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={
                        isOutOfStock || quantity > calculatedStock || quantity === 0 || isAdding // isAdding holatini ham qo'shdik
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
    </div>
  );
};

export default ProductDetail;