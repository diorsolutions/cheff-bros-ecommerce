import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Settings,
  Store,
  Utensils,
  ListOrdered,
  PanelLeftClose,
  PanelRightClose,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import OrderDialog from "@/components/OrderDialog";
import Dashboard from "@/components/Dashboard";
import AdminLoginPage from "@/components/AdminLoginPage"; // Import new AdminLoginPage
import CurierLoginPage from "@/components/CurierLoginPage"; // Import new CurierLoginPage
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedRouteCurier from "@/components/ProtectedRouteCurier";
import MiniChat from "@/components/MiniChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import CurierInterFace from "./components/curier/CurierInterFace";
import { useWindowSize } from "react-use";
import { generateShortOrderId } from "@/lib/utils";

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [curiers, setCuriers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      let cols = 2;
      let rows = 5;

      if (width >= 1024) {
        cols = 4;
        rows = 2;
      } else if (width >= 768) {
        cols = 3;
        rows = 3;
      } else {
        cols = 2;
        rows = 5;
      }

      const newItemsPerPage = cols * rows;
      setItemsPerPage((prevItemsPerPage) => {
        if (prevItemsPerPage !== newItemsPerPage) {
          setCurrentPage(1);
        }
        return newItemsPerPage;
      });
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingProducts(true);
        setProductsError(null);
        let { data: productsData, error: productsErr } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        if (productsErr) {
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: false });
          if (fallbackErr) {
            setProductsError(
              fallbackErr.message ||
                productsErr.message ||
                "Mahsulotlarni yuklashda xatolik"
            );
            toast({
              title: "Xatolik",
              description:
                fallbackErr.message ||
                productsErr.message ||
                "Mahsulotlarni yuklashda xatolik",
              variant: "destructive",
            });
          } else {
            productsData = fallbackData;
            setProducts(productsData || []);
          }
        } else {
          setProducts(productsData || []);
        }
      } catch (e) {
        setProductsError(e.message || "Mahsulotlarni yuklashda xatolik");
        toast({
          title: "Xatolik",
          description: e.message,
          variant: "destructive",
        });
      } finally {
        setLoadingProducts(false);
      }

      try {
        setLoadingOrders(true);
        setOrdersError(null);
        let { data: ordersData, error: ordersErr } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });
        if (ordersErr) {
          const { data: fbOrders, error: fbOrdersErr } = await supabase
            .from("orders")
            .select("*")
            .order("id", { ascending: false });
          if (fbOrdersErr) {
            setOrdersError(
              fbOrdersErr.message ||
                ordersErr.message ||
                "Buyurtmalarni yuklashda xatolik"
            );
          } else {
            ordersData = fbOrders;
            setOrders(ordersData || []);
          }
        } else {
          setOrders(ordersData || []);
        }
      } catch (e) {
        setOrdersError(e.message || "Buyurtmalarni yuklashda xatolik");
      } finally {
        setLoadingOrders(false);
      }

      try {
        const { data: curiersData, error: curiersErr } = await supabase
          .from("curiers")
          .select("id, name, phone");
        if (curiersErr) {
          console.error("Kuryerlarni yuklashda xatolik:", curiersErr);
        } else {
          setCuriers(curiersData || []);
        }
      } catch (e) {
        console.error("Kuryerlarni yuklashda kutilmagan xatolik:", e);
      }
    };

    fetchInitialData();

    let productChannel, orderChannel, messageChannel, curierChannel;
    try {
      productChannel = supabase
        .channel("realtime-products")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setProducts((prev) => [payload.new, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setProducts((prev) =>
                prev.map((p) => (p.id === payload.new.id ? payload.new : p))
              );
            } else if (payload.eventType === "DELETE") {
              setProducts((prev) =>
                prev.filter((p) => p.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    } catch (_) {}

    try {
      orderChannel = supabase
        .channel("realtime-orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setOrders((prev) => [payload.new, ...prev]);
              toast({
                title: "Yangi buyurtma!",
                description: "Yangi buyurtma keldi",
              });
            } else if (payload.eventType === "UPDATE") {
              setOrders((prev) =>
                prev.map((o) => (o.id === payload.new.id ? payload.new : o))
              );
            } else if (payload.eventType === "DELETE") {
              setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    } catch (_) {}

    try {
      messageChannel = supabase
        .channel("realtime-messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            if (
              customerInfo.phone &&
              payload.new.customer_phone === customerInfo.phone
            ) {
              setMessages((prev) => [...prev, payload.new]);
            }
          }
        )
        .subscribe();
    } catch (_) {}

    try {
      curierChannel = supabase
        .channel("realtime-curiers")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "curiers" },
          (payload) => {
            console.log("Curier real-time event received:", payload);
            if (payload.eventType === "INSERT") {
              setCuriers((prev) => [...prev, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setCuriers((prev) =>
                prev.map((c) => (c.id === payload.new.id ? payload.new : c))
              );
            } else if (payload.eventType === "DELETE") {
              setCuriers((prev) => prev.filter((c) => c.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.error("Error subscribing to curier real-time channel:", e);
    }

    return () => {
      if (productChannel) supabase.removeChannel(productChannel);
      if (orderChannel) supabase.removeChannel(orderChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (curierChannel) supabase.removeChannel(curierChannel);
    };
  }, [customerInfo.phone]);

  useEffect(() => {
    if (customerInfo.phone) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("customer_phone", customerInfo.phone)
          .order("timestamp", { ascending: true });
        if (error) console.error("Error fetching messages:", error);
        else setMessages(data || []);
      };
      fetchMessages();
    }
  }, [customerInfo.phone]);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + product.quantity }
            : item
        );
      }
      return [...prev, product];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const decreaseCartItem = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const increaseCartItem = (productId) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleOrderSubmit = async (orderData) => {
    const { customer, items, location, totalPrice } = orderData;

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product || product.stock < item.quantity) {
        toast({
          title: "Xatolik!",
          description: `${item.name} yetarli miqdorda yo'q`,
          variant: "destructive",
        });
        return;
      }
    }

    setCustomerInfo(customer);

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      await supabase
        .from("products")
        .update({ stock: product.stock - item.quantity })
        .eq("id", item.id);
    }

    const { error: orderError, data: insertedOrder } = await supabase.from("orders").insert([
      {
        customer_info: customer,
        items: items,
        location,
        total_price: totalPrice,
        status: "new",
      },
    ]).select('id').single();

    if (orderError) {
      toast({
        title: "Xatolik!",
        description: "Buyurtma yuborishda xatolik yuz berdi.",
        variant: "destructive",
      });
      return;
    }

    const shortOrderId = generateShortOrderId(insertedOrder.id);

    const boldItemNames = items.map((item) => `*${item.name}*`).join(", ");

    const systemMessage = `Sizning 
    ${boldItemNames}
    nomli buyurtma(lari)ngiz muvaffaqiyatli qabul qilindi. Buyurtma ID: *${shortOrderId}*. Endi tasdiqlashini kuting. Tasdiqlanganida buyurtmangiz allaqachon tayyorlab *kurier* orqali jo'natilganligini anglatadi.`;

    await handleSendMessage(customer.phone, systemMessage);

    setCartItems([]);
    toast({
      title: "Buyurtma qabul qilindi!",
      description: `Sizning buyurtmangiz muvaffaqiyatli yuborildi. ID: ${shortOrderId}`,
    });
  };

  const handleUpdateOrderStatus = async (
    orderId,
    newStatus,
    curierId = null
  ) => {
    const orderToUpdate = orders.find((o) => o.id === orderId);

    if (!orderToUpdate) {
      toast({
        title: "Xatolik!",
        description: "Buyurtma topilmadi.",
        variant: "destructive",
      });
      return;
    }

    let canUpdate = false;
    let updateData = { status: newStatus };

    if (curierId) {
      if (orderToUpdate.curier_id && orderToUpdate.curier_id !== curierId) {
        toast({
          title: "Xatolik!",
          description:
            "Bu buyurtma allaqachon boshqa kuryer tomonidan qabul qilingan.",
          variant: "destructive",
        });
        return;
      }

      switch (newStatus) {
        case "en_route_to_kitchen":
          if (orderToUpdate.status === "new" && !orderToUpdate.curier_id) {
            canUpdate = true;
            updateData.curier_id = curierId;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma allaqachon qabul qilingan yoki boshqa statusda.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "picked_up_from_kitchen":
          if (
            orderToUpdate.status === "en_route_to_kitchen" &&
            orderToUpdate.curier_id === curierId
          ) {
            canUpdate = true;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma hali kuryer tomonidan olinmagan yoki boshqa statusda.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "delivered_to_customer":
        case "cancelled":
          if (
            orderToUpdate.status === "picked_up_from_kitchen" &&
            orderToUpdate.curier_id === curierId
          ) {
            canUpdate = true;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma hali kuryer tomonidan olinmagan yoki yakunlangan.",
              variant: "destructive",
            });
            return;
          }
          break;
        default:
          toast({
            title: "Xatolik!",
            description: "Noto'g'ri status o'zgarishi.",
            variant: "destructive",
          });
          return;
      }
    } else {
      if (orderToUpdate.curier_id) {
        toast({
          title: "Xatolik!",
          description:
            "Bu buyurtma kuryerga biriktirilgan. Faqat kuryer o'zgartira oladi.",
          variant: "destructive",
        });
        return;
      }
      canUpdate = true;
    }

    if (!canUpdate) {
      toast({
        title: "Xatolik!",
        description: "Statusni o'zgartirish mumkin emas.",
        variant: "destructive",
      });
      return;
    }

    console.log("Sending update to Supabase:", { orderId, updateData });
    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      console.error("Supabase update error:", error);
      toast({
        title: "Xatolik!",
        description: "Statusni yangilashda xatolik.",
        variant: "destructive",
      });
      return;
    }

    const order = orders.find((o) => o.id === orderId);
    if (order) {
      let message = "";
      switch (newStatus) {
        case "en_route_to_kitchen":
          message = `Sizning buyurtmangizni olish uchun kuryer yo'lga chiqdi!`;
          break;
        case "picked_up_from_kitchen":
          message = `Sizning buyurtmangiz kuryer tomonidan olindi va manzilingizga yo'lga chiqdi!`;
          break;
        case "delivered_to_customer":
          const itemNames = order.items.map((item) => item.name).join(", ");
          message = `Sizning ${itemNames} nomli buyurtmalaringiz muvaffaqiyatli yetkazib berildi!`;
          break;
        case "cancelled":
          message = `Hurmatli mijoz, uzur so'raymiz sizning buyurtmangiz bekor qilindi, sababini bilishni hohlasangiz quyidagi +998907254545 raqamiga qo'ng'iroq qiling`;
          break;
        default:
          break;
      }

      if (message) {
        await handleSendMessage(order.customer_info.phone, message);
      }
    }
    toast({
      title: "Status yangilandi",
      description: `Buyurtma statusi yangilandi.`,
    });
  };

  const handleSendMessage = async (phone, text) => {
    await supabase
      .from("messages")
      .insert([{ customer_phone: phone, text, type: "system" }]);
  };

  const cartItemsCount = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <>
      <Helmet>
        <title>Restoran - Online Buyurtma Tizimi</title>
        <meta
          name="description"
          content="Eng mazali taomlarni online buyurtma qiling. Tez va qulay yetkazib berish xizmati."
        />
      </Helmet>

      <Routes>
        <Route path="/admin" element={<AdminLoginPage />} /> {/* Admin login route */}
        <Route path="/curier-login" element={<CurierLoginPage />} /> {/* Courier login route */}
        <Route
          path="/curier"
          element={
            <ProtectedRouteCurier>
              <CurierInterFace
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
              />
            </ProtectedRouteCurier>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard
                products={products}
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                curiers={curiers}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:id"
          element={<ProductDetail onAddToCart={addToCart} />}
        />
        <Route
          path="/"
          element={
            <MainLayout
              cartItems={cartItems}
              cartItemsCount={cartItemsCount}
              products={products}
              addToCart={addToCart}
              setIsOrderDialogOpen={setIsOrderDialogOpen}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              itemsPerPage={itemsPerPage}
              loadingProducts={loadingProducts}
              productsError={productsError}
              messages={messages}
            />
          }
        />
      </Routes>

      <OrderDialog
        isOpen={isOrderDialogOpen}
        onClose={() => setIsOrderDialogOpen(false)}
        cartItems={cartItems}
        onOrderSubmit={handleOrderSubmit}
        removeFromCart={removeFromCart}
        decreaseCartItem={decreaseCartItem}
        increaseCartItem={increaseCartItem}
      />
      <Toaster />
    </>
  );
}

function MainLayout({
  cartItems,
  cartItemsCount,
  products,
  addToCart,
  setIsOrderDialogOpen,
  categoryFilter,
  setCategoryFilter,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  loadingProducts,
  productsError,
  messages,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { width } = useWindowSize();

  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);

    if (width >= 1024) {
      toast({
        title: "Savatga qo'shildi!mi?",
        description: `${product.name} (${quantity} dona) savatga qo'shildi`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <header className="bg-white/70 backdrop-blur-lg border-b border-gray-300 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 extra_small:gap-1 mob_xr:gap-1 text-orange-400">
              <Store className="h-8 w-8 extra_small:w-6 extra_small:h-6 mob_xr:h-6 mob_xr:w-6" />
              <h1 className="text-2xl font-bold extra_small:text-xl mob_xr:text-[1.3rem]">
                Restoran
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsOrderDialogOpen(true)}
                disabled={cartItems.length === 0}
                className="extra_small:text-xs mob_xr:text-[.7rem] rounded-[.4rem] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white relative"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buyurtma berish
                {cartItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="w-full mx-auto max-w-[1376px] bg-white/90">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mob_small:mb-0 mob_xr:mb-0 mid_small:mb-0 extra_small:mb-0 mb-8 sm:mb-12 px-4">
            <h2 className="mob_small:hidden text-3xl sm:text-4xl mob_xr:text-[1.29rem] font-bold text-gray-800 mb-3 sm:mb-4 extra_small:text-[1.2rem]">
              Bizning Menyumiz
            </h2>
            <p className=" mob_small:hidden text-base sm:text-xl mob_xr:hidden text-gray-600 max-w-2xl mx-auto extra_small:hidden">
              Eng mazali va sifatli taomlarni tanlang. Barcha taomlar yangi
              ingredientlar bilan tayyorlanadi.
            </p>
          </div>

          <div className="mob_small:bg-white mob_xr:bg-white mid_small:bg-white mob_small:py-[.5rem] mob_xr:py-[.5rem] mid_small:py-[.5rem] extra_small:sticky mob_small:sticky mob_xr:sticky mid_small:sticky mob_small:top-0 mob_xr:top-0 mid_small:top-0  mob_small:z-50 mob_xr:z-50 mid_small:z-50 extra_small:top-0 extra_small:z-30 extra_small:bg-white extra_small:py-2 px-4 extra_small:mb-1 mb-6 mob_xr:gap-1 focus:*:bg-orange-500 *:rounded-[0.3rem] justify-center flex flex-wrap items-center gap-2 extra_small:gap-1 sm:gap-3">
            {[
              { key: "all", label: "Barchasi" },
              { key: "Hoddog", label: "Hoddog" },
              { key: "Ichimliklar", label: "Ichimliklar" },
              { key: "Disertlar", label: "Disertlar" },
            ].map((c) => (
              <Button
                key={c.key}
                variant={categoryFilter === c.key ? "secondary" : "ghost"}
                className={
                  categoryFilter === c.key
                    ? "bg-orange-500 extra_small:p-2 mid_small:text-[0.7rem] text-white extra_small:text-[0.8rem] mob_xr:text-[0.9rem]"
                    : "text-gray-800 mid_small:text-[0.7rem] hover:bg-gray-300 hover:text-orange-400 border border-gray-300 extra_small:text-[0.7rem] mob_xr:text-[0.8rem]"
                }
                onClick={() => {
                  setCategoryFilter(c.key);
                  setCurrentPage(1);
                }}
              >
                {c.label}
              </Button>
            ))}
          </div>

          <div className="px-4 mb-10">
            {productsError ? (
              <div className="text-center text-red-600 bg-red-100 border border-red-300 rounded-md p-4">
                {productsError}
              </div>
            ) : loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: itemsPerPage }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-lg bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <>
                {(() => {
                  const all =
                    categoryFilter === "all"
                      ? products
                      : products.filter((p) => p.category === categoryFilter);

                  const pageItems = all.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  );

                  return (
                    <>
                      {all.length === 0 ? (
                        <div className="text-center text-gray-300 py-16">
                          Hozircha mahsulotlar yo'q.
                        </div>
                      ) : (
                        <div className="grid mt-[-13px] extra_small:mt-[0px] mob_small:gap-[0.4rem] grid-cols-2 mob_xr:gap-[0.4rem] md:grid-cols-3 extra_small:gap-[0.5rem] lg:grid-cols-4 sm:gap-2">
                          {pageItems.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={addToCart}
                            />
                          ))}
                        </div>
                      )}

                      {(() => {
                        const totalPages =
                          Math.ceil(all.length / itemsPerPage) || 1;
                        const canPrev = currentPage > 1;
                        const canNext = currentPage < totalPages;
                        return (
                          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-8">
                            <Button
                              variant="ghost"
                              disabled={!canPrev}
                              onClick={() =>
                                canPrev && setCurrentPage((p) => p - 1)
                              }
                              className="text-gray-800 hover:bg-gray-200"
                            >
                              Oldingi
                            </Button>
                            <span className="text-gray-600 text-sm sm:text-base">
                              {currentPage} / {totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              disabled={!canNext}
                              onClick={() =>
                                canNext && setCurrentPage((p) => p + 1)
                              }
                              className="text-gray-800 hover:bg-gray-200"
                            >
                              Keyingi
                            </Button>
                          </div>
                        );
                      })()}
                    </>
                  );
                })()}
              </>
            )}
          </div>

          {cartItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 left-6 z-20"
            >
              <Card className="laptop:hidden w-full max-w-[15rem] mob:max-w-[12rem] extra_small:max-w-[10rem] flex flex-col justify-start bg-white border-orange-500/90">
                <CardHeader className="pb-2">
                  <CardTitle className="text-gray-800 text-center text-lg">
                    Savat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-4">
                  {cartItems.map((item, index) => {
                    const currentProduct = products.find(
                      (p) => p.id === item.id
                    );
                    const stock = currentProduct?.stock || 0;
                    return (
                      <div
                        key={index}
                        className="space-y-1 border-b border-gray-300 py-2"
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {item.name} x{item.quantity}
                          </span>
                          <span className="text-orange-500 font-medium">
                            {(item.price * item.quantity).toLocaleString()} so'm
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-300 pt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-800">Jami:</span>
                      <span className="text-orange-500">
                        {cartItems
                          .reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                          .toLocaleString()}{" "}
                        so'm
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </main>
      <MiniChat messages={messages} />
    </div>
  );
}

export default App;