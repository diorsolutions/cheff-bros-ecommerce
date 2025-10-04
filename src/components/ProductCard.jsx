import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Minus, Eye } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useWindowSize } from "react-use";
import { calculateProductStock } from "@/utils/stockCalculator"; // Import stock calculator

const ProductCard = ({ product, onAddToCart, allProducts, allIngredients, allProductIngredients }) => {
  const [quantity, setQuantity] = useState(1);
  
  // calculateProductStock funksiyasini to'g'ri `allProducts` prop bilan chaqirish
  const calculatedStock = calculateProductStock(
    product.id,
    allProducts,
    allIngredients,
    allProductIngredients
  );
  const isOutOfStock = calculatedStock === 0;

  const biggestThanPc = useMediaQuery({ minWidth: 1024 });
  const isBigTablet = useMediaQuery({ minWidth: 954 });
  const isTablet = useMediaQuery({ minWidth: 780 });
  const isMobile = useMediaQuery({ maxWidth: 530 });
  const isMob_small = useMediaQuery({ maxWidth: 431 });
  const isMob_xr = useMediaQuery({ maxWidth: 415 });
  const isMob_se = useMediaQuery({ maxWidth: 373 });

  let sliceLength = 40;
  if (isBigTablet) sliceLength = 30;
  if (isMob_se) sliceLength = 18;
  if (isTablet) sliceLength = 25;
  if (biggestThanPc) sliceLength = 40;
  if (isMob_xr) sliceLength = 20;
  if (isMobile) sliceLength = 22;
  if (isMob_small) sliceLength = 15;

  let sliceLength_p_name = 19;
  if (isBigTablet) sliceLength_p_name = 10;
  if (isMob_se) sliceLength_p_name = 8;
  if (isMob_xr) sliceLength_p_name = 10;
  if (isMobile) sliceLength_p_name = 10;
  if (isTablet) sliceLength_p_name = 19;
  if (isMob_small) sliceLength_p_name = 9;

  const { width } = useWindowSize();
  const handleAddToCart = () => {
    if (quantity > calculatedStock) { // calculatedStock ishlatildi
      toast({
        title: "Xatolik!",
        description: `Faqat ${calculatedStock} ta mavjud`,
        variant: "destructive",
      });
      return;
    }
    onAddToCart({ ...product, quantity });
    if (width >= 1024) {
      toast({
        title: "Savatga qo'shildi!mi aaa?",
        description: `${product.name} (${quantity} dona) savatga qo'shildi`,
      });
    }
  };

  const incrementQuantity = () => {
    if (quantity < calculatedStock) { // calculatedStock ishlatildi
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
      className="h-full bg-gray-300/80"
    >
      <Card className="h-full flex flex-col gap-2 bg-white shadow-[0_4px_16px_rgba(17,17,26,0.1),0_8px_32px_rgba(17,17,26,0.05)] border-gray-200 rounded-lg transition-all duration-500">
        {" "}
        <CardContent className="p-2 flex-grow flex flex-col">
          <Link
            to={`/product/${product.id}`}
            className="aspect-video mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 relative group"
          >
            <img
              className="w-full h-full object-cover rounded-lg"
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
            <h3 className="mob_xr:text-xs text-[0.92rem] nor_tablet:text-sm big_tablet:text-[1.1rem] extra_small:text-[0.75rem] font-bold text-gray-600 extra_small:leading-[0.9rem]">
              {" "}
              {product.name.slice(0, sliceLength_p_name) + "..."}
            </h3>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded extra_small:leading-[0.2rem] extra_small:text-[0.6rem] extra_small:min-w-max ${
                calculatedStock > 10 // calculatedStock ishlatildi
                  ? "bg-green-100 text-green-600"
                  : calculatedStock > 5
                  ? "bg-orange-100 text-orange-600"
                  : calculatedStock > 0
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {calculatedStock > 0 ? `${calculatedStock} ta qoldi` : "Tugadi"}{" "}
              {/* calculatedStock ishlatildi */}
            </span>
          </div>
          <p className="text-gray-600 mob_xr:text-xs text-sm mb-3 line-clamp-2 flex-grow extra_small:text-[0.75rem] ">
            {" "}
            {/* Matn rangi yangilandi */}
            {product.description.slice(0, sliceLength) + "..."}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <span className="mob_xr:text-xs text-[1rem] big_tablet:text-[1.2rem] mob_small:text-[0.8rem] font-semibold text-orange-500 extra_small:text-[0.73rem] ">
              {" "}
              {/* Matn rangi yangilandi */}
              {Number(product.price).toLocaleString()} so'm
            </span>
            <div className="flex mob_xr:text-xs mob_xr:gap-0 mob_small:gap-0 items-center gap-2 bg-gray-100 rounded-lg p-1 extra_small:p-0 extra_small:gap-0 extra_small:text-[0.75rem] ">
              {" "}
              {/* Rang yangilandi */}
              <Button
                size="sm"
                variant="ghost"
                onClick={decrementQuantity}
                className="big_tablet:h-3 big_tablet:w-3 h-8 w-8 p-0 rounded-lg extra_small:text-[0.75rem]  text-gray-800 hover:bg-gray-200"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="text-gray-800 big_tablet:text-[0.8rem] font-medium w-8 text-center">
                {quantity}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={incrementQuantity}
                disabled={isOutOfStock || quantity >= calculatedStock} // calculatedStock ishlatildi
                className="big_tablet:h-3 big_tablet:w-3 h-8 w-8 p-0 rounded-lg text-gray-800 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-2 pt-0">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || quantity > calculatedStock || quantity === 0} // calculatedStock ishlatildi
            className="mob_xr:text-[0.7rem] extra_small:text-[0.7rem] extra_small:p-0 mob_small:text-[0.8rem] w-full bg-gradient-to-r rounded-[0.4rem] from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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