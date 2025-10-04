import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Truck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateShortOrderId } from "@/lib/utils";

const ClientOrderStatusModal = ({
  activeOrderId,
  orders,
  chefs,
  curiers,
  customerPhone,
}) => {
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  // Helper function to get chef/courier info
  const getChefInfo = (id) => chefs.find((c) => c.id === id);
  const getCurierInfo = (id) => curiers.find((c) => c.id === id);

  useEffect(() => {
    if (!activeOrderId || !customerPhone) {
      setCurrentOrder(null);
      setIsVisible(false);
      return;
    }

    const order = orders.find(
      (o) => o.id === activeOrderId && o.customer_info.phone === customerPhone
    );

    if (order) {
      setCurrentOrder(order);
      // Hide if delivered or cancelled
      if (
        order.status === "delivered_to_customer" ||
        order.status === "cancelled"
      ) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    } else {
      setCurrentOrder(null);
      setIsVisible(false);
    }
  }, [activeOrderId, orders, customerPhone]);

  const getStatusDisplay = useMemo(() => {
    if (!currentOrder) return null;

    const { status, chef_id, curier_id } = currentOrder;
    const chefName = chef_id ? getChefInfo(chef_id)?.name : null;
    const curierName = curier_id ? getCurierInfo(curier_id)?.name : null;

    let chefDisplay = null;
    let courierDisplay = null;
    let mainStatusIcon = null;

    // Determine main status icon and initial chef/courier messages
    switch (status) {
      case "new":
        mainStatusIcon = <Clock className="h-5 w-5 text-blue-500" />;
        chefDisplay = "Buyurtma qabul qilindi, oshpazni kutmoqda.";
        break;
      case "preparing":
        mainStatusIcon = <Utensils className="h-5 w-5 text-yellow-500" />;
        chefDisplay = "Tayyorlanmoqda...";
        break;
      case "ready":
        mainStatusIcon = <CheckCircle className="h-5 w-5 text-green-500" />;
        chefDisplay = "Buyurtmangizni tayyorlab bo'ldi!";
        break;
      case "en_route_to_kitchen":
        mainStatusIcon = <Truck className="h-5 w-5 text-yellow-500" />;
        chefDisplay = "Buyurtmangizni tayyorlab bo'ldi!"; // Chef already finished
        courierDisplay = "Buyurtmangizni olish uchun yo'lga chiqdi...";
        break;
      case "picked_up_from_kitchen":
        mainStatusIcon = <Truck className="h-5 w-5 text-orange-500" />;
        chefDisplay = "Buyurtmangizni tayyorlab bo'ldi!"; // Chef already finished
        courierDisplay = "Buyurtmangizni oldi va siz tomon yo'lga chiqdi!";
        break;
      case "delivered_to_customer":
      case "cancelled":
        // These statuses hide the modal, so they won't be displayed here.
        return null;
      default:
        chefDisplay = "Status noma'lum.";
        break;
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-800">
          {mainStatusIcon}
          <span className="font-semibold text-lg">Buyurtmangizni ayni vaqtda:</span>
        </div>
        {chefDisplay && (
          <p className="text-gray-700 text-base ml-7">
            {status !== "new" && <span className="font-medium">Oshpaz: </span>}
            {chefDisplay}
          </p>
        )}
        {courierDisplay && (
          <p className="text-gray-700 text-base ml-7">
            <span className="font-medium">Kuryer: </span>
            {courierDisplay}
          </p>
        )}
      </div>
    );
  }, [currentOrder, chefs, curiers]);

  if (!isVisible || !currentOrder) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 z-50 w-full h-[12vh] bg-white border-t border-gray-300 shadow-lg flex items-center justify-center p-4"
        >
          <Card className="w-full h-full flex items-center justify-center bg-white border-none shadow-none">
            <CardContent className="p-0 flex items-center justify-center text-center">
              {getStatusDisplay}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClientOrderStatusModal;