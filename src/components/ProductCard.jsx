import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus, Eye } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

const ProductCard = ({ product, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const stock = product.stock || 0;
  const isOutOfStock = stock === 0;

  const isBigTablet = useMediaQuery({ minWidth: 954 });
  const isTablet = useMediaQuery({ minWidth: 780 });
  const isMobile = useMediaQuery({ maxWidth: 530 });

  let sliceLength = 40;
  if (isBigTablet) sliceLength = 120;
  else if (isTablet) sliceLength = 80;
  else if (isMobile) sliceLength = 22;

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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: 0 }}
      className="h-full"
    >
      <Card className="h-full flex flex-col gap-5 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-white/10 transition-all duration-500">
        <CardContent className="p-2 flex-grow flex flex-col">
          <Link
            to={`/product/${product.id}`}
            className="aspect-video mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-orange-400 to-red-500 relative group"
          >
            <img
              className="w-full h-full object-cover"
              alt={product.name}
              src={
                product.image_url ||
                "https://images.unsplash.com/photo-1559223669-e0065fa7f142"
              }
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Eye className="h-12 w-12 text-white" />
            </div>
          </Link>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl nor_tablet:text-sm big_tablet:text-[1.1rem] font-bold text-white">
              {product.name}
            </h3>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded ${
                stock > 10
                  ? "bg-green-500/20 text-green-400"
                  : stock > 5
                  ? "bg-orange-500/20 text-orange-400"
                  : stock > 0
                  ? "bg-red-500/20 text-red-400"
                  : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {stock > 0 ? `${stock} ta qoldi` : "Tugadi"}
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-3 line-clamp-2 flex-grow">
            {product.description.slice(0, sliceLength) + "..."}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="text-[1.1rem] big_tablet:text-[1.2rem] mob_small:text-[0.8rem] font-bold text-orange-400">
              {Number(product.price).toLocaleString()} so'm
            </span>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={decrementQuantity}
                className="big_tablet:h-3 big_tablet:w-3 h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-white big_tablet:text-[0.8rem] font-medium w-8 text-center">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={incrementQuantity}
                disabled={isOutOfStock || quantity >= stock}
                className="big_tablet:h-3 big_tablet:w-3 h-8 w-8 p-0 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-2 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || quantity > stock || quantity === 0} // Tugma disabled bo'ladi agar stock tugasa yoki miqdor stockdan oshsa
            className="mob_small:text-[0.8rem] w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isOutOfStock ? "Tugadi" : "Savatga qo'shish"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ProductCard;