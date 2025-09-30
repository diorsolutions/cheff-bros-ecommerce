import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";

const ProductDetail = ({ onAddToCart }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };

    fetchProduct();

    const channel = supabase
      .channel(`product-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `id=eq.${id}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            navigate("/");
          } else {
            setProduct(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!product) return null;

  const stock = product.stock || 0;
  const isOutOfStock = stock === 0;

  const handleAddToCart = () => {
    if (quantity > stock) {
      toast({
        title: "Xatolik!",
        description: `Faqat ${stock} ta mavjud`,
        variant: "destructive",
      });
      return;
    }
    onAddToCart({ ...product, quantity });
    toast({
      title: "Savatga qo'shildi!",
      description: `${product.name} (${quantity} dona) savatga qo'shildi`,
    });
  };

  const incrementQuantity = () => {
    if (quantity < stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => setQuantity((prev) => Math.max(1, prev - 1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-white mb-6 hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Orqaga
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 sm:p-6 lg:p-10">
                {/* Product Image */}
                <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-orange-400 to-red-500 shadow-md">
                  <img
                    className="w-full h-full object-cover"
                    alt={product.name}
                    src={
                      product.image_url ||
                      "https://images.unsplash.com/photo-1559223669-e0065fa7f142"
                    }
                  />
                </div>

                {/* Product Details */}
                <div className="flex flex-col justify-start space-y-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                      {product.name}
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg mb-6 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="mb-6">
                      <span
                        className={`text-sm font-semibold px-3 py-2 rounded ${
                          stock > 10
                            ? "bg-green-500/20 text-green-400"
                            : stock > 5
                            ? "bg-orange-500/20 text-orange-400"
                            : stock > 0
                            ? "bg-red-500/20 text-red-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {stock > 0
                          ? `${stock} ta qoldi - ulgurib qoling`
                          : "Qolmagan"}
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-400">
                        {Number(product.price).toLocaleString()} so'm
                      </span>
                    </div>
                  </div>

                  {/* Quantity + Add to Cart */}
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="text-white font-medium">Miqdor:</span>
                      <div className="flex items-center gap-2 bg-white/10 rounded-lg p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={decrementQuantity}
                          disabled={isOutOfStock}
                          className="h-10 w-10 p-0 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-5 w-5" />
                        </Button>
                        <span className="text-white font-bold text-xl w-12 text-center">
                          {quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={incrementQuantity}
                          disabled={isOutOfStock || quantity >= stock}
                          className="h-10 w-10 p-0 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <Button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="w-full h-12 sm:h-14 text-base sm:text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {isOutOfStock ? "Tugadi" : "Savatga qo'shish"}
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
