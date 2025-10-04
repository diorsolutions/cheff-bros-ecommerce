import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Truck, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { generateShortOrderId } from "@/lib/utils";
import { useWindowSize } from "react-use"; // useWindowSize import qilindi

const ClientOrderStatusModal = ({
  activeOrderIds, // Endi massiv sifatida qabul qilinadi
  orders,
  chefs,
  curiers,
  customerPhone,
}) => {
  const { width } = useWindowSize();
  const isMobile = width < 768; // Mobil breakpoint

  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false); // Mobil rejimda kengaytirish holati

  // Helper function to get chef/courier info
  const getChefInfo = (id) => chefs.find((c) => c.id === id);
  const getCurierInfo = (id) => curiers.find((c) => c.id === id);

  const customerActiveOrders = useMemo(() => {
    if (!customerPhone || activeOrderIds.length === 0) return [];
    return orders.filter(
      (o) =>
        activeOrderIds.includes(o.id) &&
        o.customer_info.phone === customerPhone &&
        o.status !== "delivered_to_customer" &&
        o.status !== "cancelled"
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); // Eng eski buyurtma birinchi
  }, [activeOrderIds, orders, customerPhone]);

  const currentOrder = customerActiveOrders[currentOrderIndex];

  useEffect(() => {
    // Agar joriy buyurtma endi faol bo'lmasa yoki massiv o'zgarsa, indeksni qayta o'rnatish
    if (!currentOrder || !activeOrderIds.includes(currentOrder.id)) {
      setCurrentOrderIndex(0);
    }
    // Agar faol buyurtmalar bo'lmasa, modalni yashirish
    if (customerActiveOrders.length === 0) {
      setIsExpanded(false); // Buyurtmalar yo'q bo'lsa yig'ish
    }
  }, [activeOrderIds, customerActiveOrders, currentOrder]);

  const handleNextOrder = () => {
    setCurrentOrderIndex((prevIndex) => (prevIndex + 1) % customerActiveOrders.length);
    setIsExpanded(false); // Buyurtma o'zgarganda yig'ish
  };

  const handlePrevOrder = () => {
    setCurrentOrderIndex((prevIndex) => (prevIndex - 1 + customerActiveOrders.length) % customerActiveOrders.length);
    setIsExpanded(false); // Buyurtma o'zgarganda yig'ish
  };

  const handleToggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // getStatusDisplay useMemo hookini shartli return'dan oldinga ko'chirdik
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

    if (isMobile && !isExpanded) {
      return (
        <div className="bg-transparent flex items-center justify-center flex-row gap-2">
          {mainStatusIcon}
          <span className="font-semibold text-lg text-gray-100">
            Buyurtmangizni ayni vaqtda:
          </span>
        </div>
      );
    }

    return (
      <div className="bg-transparent flex items-start justify-center flex-col gap-2">
        <div className="flex items-center gap-2 text-gray-100">
          {mainStatusIcon}
          <span className="font-semibold text-lg">
            Buyurtmangizni ayni vaqtda:
          </span>
        </div>
        {chefDisplay && (
          <p className="text-gray-400 text-base ml-7">
            {status !== "new" && <span className="font-medium text-white">Oshpaz: </span>}
            {chefDisplay}
          </p>
        )}
        {courierDisplay && (
          <p className="text-gray-400 text-base ml-7">
            <span className="font-medium text-white">Kuryer: </span>
            {courierDisplay}
          </p>
        )}
      </div>
    );
  }, [currentOrder, chefs, curiers, isMobile, isExpanded]);

  // Faqat bitta shartli return qoldirdik
  if (customerActiveOrders.length === 0 || !currentOrder) return null;

  return (
    <AnimatePresence>
      {customerActiveOrders.length > 0 && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={`fixed z-10 rounded-tr-[1rem] bottom-0 left-0 right-0 h-auto bg-black border-t border-gray-300 shadow-lg flex items-center justify-center p-4 cursor-pointer ${isMobile && !isExpanded ? 'h-16' : ''}`}
          onClick={isMobile ? handleToggleExpand : undefined} // Mobil rejimda bosish orqali kengaytirish
        >
          <Card className="w-full h-full flex items-center justify-center bg-transparent border-none shadow-none">
            <CardContent className="p-0 flex items-center justify-between text-left w-full">
              {customerActiveOrders.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); handlePrevOrder(); }} className="p-2 rounded-full hover:bg-gray-700 text-white">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex-1 flex items-center justify-center">
                {getStatusDisplay}
              </div>
              {customerActiveOrders.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); handleNextOrder(); }} className="p-2 rounded-full hover:bg-gray-700 text-white">
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ClientOrderStatusModal;