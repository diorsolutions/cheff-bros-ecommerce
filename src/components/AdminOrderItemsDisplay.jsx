import React from 'react';
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Utensils } from "lucide-react";
import { useMediaQuery } from "react-responsive";

const AdminOrderItemsDisplay = ({ items, totalPrice }) => {
  const isMobSmall = useMediaQuery({ maxWidth: 431 });

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-center text-sm mob_small:text-xs">
          <div className="flex items-center gap-2">
            <Utensils className="h-3 w-3 text-gray-400" />
            <span className="text-gray-300">{item.name}</span>
            <Badge variant="secondary" className="bg-white/10 text-white/80 border-white/20 px-2 py-0.5 text-xs">
              x{item.quantity}
            </Badge>
          </div>
          <span className="text-white/80 font-medium whitespace-nowrap">
            {formatPrice(item.price * item.quantity)} so'm
          </span>
        </div>
      ))}
      <div className="border-t border-white/20 pt-2 mt-2">
        <div className="flex justify-between font-bold">
          <span className="text-white text-sm mob_small:text-sm">Jami:</span>
          <span className="text-white text-lg mob_small:text-base">
            {formatPrice(totalPrice)} so'm
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderItemsDisplay;