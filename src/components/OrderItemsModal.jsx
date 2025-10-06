import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

const OrderItemsModal = ({ isOpen, onClose, orderItems, orderId }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white border-gray-300 text-gray-800 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-gray-800">
            Buyurtma #{orderId} mahsulotlari
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {orderItems.length === 0 ? (
            <p className="text-gray-600 text-center">Mahsulotlar topilmadi.</p>
          ) : (
            orderItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm text-gray-700">
                <span>{item.name} x {item.quantity}</span>
                <span className="font-medium text-orange-500">
                  {formatPrice(item.price * item.quantity)} so'm
                </span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderItemsModal;