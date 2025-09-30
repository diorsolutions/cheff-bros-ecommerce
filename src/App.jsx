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
import LoginPage from "@/components/LoginPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedRouteCurier from "@/components/ProtectedRouteCurier";
import MiniChat from "@/components/MiniChat"; // MiniChat qaytarildi
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import CurierInterFace from "./components/curier/CurierInterFace";

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [curiers, setCuriers] = useState([]); // Kuryerlar ro'yxati
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
  const itemsPerPage = 20;

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

      // Kuryerlar ro'yxatini yuklash
      try {
        const { data: curiersData, error: curiersErr } = await supabase
          .from("curiers")
          .select("id, name");
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

    // Kuryerlar ro'yxatini real-time yangilash
    try {
      curierChannel = supabase
        .channel("realtime-curiers")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "curiers" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setCuriers((prev) => [...prev, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setCuriers((prev) =>
                prev.map((c) => (c.id === payload.new.id ? payload.new : c))
              );
            } else if (payload.eventType === "DELETE") {
              setCuriers((prev) =>
                prev.filter((c) => c.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    } catch (_) {}

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

    const { error: orderError } = await supabase.from("orders").insert([
      {
        customer_info: customer,
        items: items,
        location,
        total_price: totalPrice,
        status: "new",
      },
    ]);

    if (orderError) {
      toast({
        title: "Xatolik!",
        description: "Buyurtma yuborishda xatolik yuz berdi.",
        variant: "destructive",
      });
      return;
    }

    const itemNames = items.map((item) => item.name).join(", ");
    const systemMessage = `Sizning ${itemNames} nomli buyurtma(lari)ngiz muvaffaqiyatli qabul qilindi. Endi tasdiqlashini kuting. Tasdiqlanganida buyurtmangiz allaqachon tayyorlab kurier orqali jo'natilganligini anglatadi.`;

    await handleSendMessage(customer.phone, systemMessage);

    setCartItems([]);
    toast({
      title: "Buyurtma qabul qilindi!",
      description: "Sizning buyurtmangiz muvaffaqiyatli yuborildi.",
    });
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, curierId = null) => {
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

    if (newStatus === "on_the_way") {
      // Faqat "new" statusdagi buyurtmani "on_the_way" ga o'tkazish mumkin
      // Va faqat agar buyurtma hali hech kim tomonidan olinmagan bo'lsa
      if (orderToUpdate.status === "new" && !orderToUpdate.curier_id) {
        canUpdate = true;
        updateData.curier_id = curierId; // Kuryer ID'sini saqlash
      } else if (orderToUpdate.curier_id && orderToUpdate.curier_id !== curierId) {
        toast({
          title: "Xatolik!",
          description: "Bu buyurtma allaqachon boshqa kuryer tomonidan qabul qilingan.",
          variant: "destructive",
        });
        return;
      } else {
        toast({
          title: "Xatolik!",
          description: "Buyurtma allaqachon qabul qilingan yoki boshqa statusda.",
          variant: "destructive",
        });
        return;
      }
    } else if (newStatus === "confirmed" || newStatus === "cancelled") {
      // Faqat "on_the_way" statusdagi buyurtmani "confirmed" yoki "cancelled" ga o'tkazish mumkin
      // Va faqat buyurtmani olgan kuryer tomonidan
      if (orderToUpdate.status === "on_the_way" && orderToUpdate.curier_id === curierId) {
        canUpdate = true;
        updateData.curier_id = curierId; // Kuryer ID'sini saqlash
      } else if (orderToUpdate.curier_id && orderToUpdate.curier_id !== curierId) {
        toast({
          title: "Xatolik!",
          description: "Bu buyurtmani faqat uni qabul qilgan kuryer yakunlashi mumkin.",
          variant: "destructive",
        });
        return;
      } else {
        toast({
          title: "Xatolik!",
          description: "Buyurtma hali kuryer tomonidan qabul qilinmagan yoki yakunlangan.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // Admin panelidan status o'zgarishlari uchun (agar kerak bo'lsa, qo'shimcha tekshiruvlar qo'shish mumkin)
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

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
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
      if (newStatus === "on_the_way") {
        message = `Sizning buyurtmangiz kuryer tomonidan qabul qilindi va yo'lda!`;
      } else if (newStatus === "confirmed") {
        const itemNames = order.items.map((item) => item.name).join(", ");
        message = `Sizning ${itemNames} nomli buyurtmalaringiz muvaffaqiyatli yetkazib berildi!`;
      } else if (newStatus === "cancelled") {
        message = `Hurmatli mijoz, uzur so'raymiz sizning buyurtmangiz bekor qilindi, sababini bilishni hohlasangiz quyidagi +998907254545 raqamiga qo'ng'iroq qiling`;
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
        <Route path="/login" element={<LoginPage />} />
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
                curiers={curiers} // Kuryerlar ro'yxatini Dashboardga uzatish
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
              messages={messages} // MiniChat uchun messages uzatildi
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
  messages, // MiniChat uchun messages qabul qilindi
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-orange-400" />
              <h1 className="text-2xl font-bold text-white">Restoran</h1>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={() => setIsOrderDialogOpen(true)}
                disabled={cartItems.length === 0}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white relative"
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

      <main className="w-full mx-auto max-w-[1376px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8 sm:mb-12 px-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
              Bizning Menyumiz
            </h2>
            <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Eng mazali va sifatli taomlarni tanlang. Barcha taomlar yangi
              ingredientlar bilan tayyorlanadi.
            </p>
          </div>

          {/* Category Filters */}
          <div className="px-4 mb-6 flex flex-wrap items-center gap-2 sm:gap-3">
            {[
              { key: "all", label: "Barchasi" },
              { key: "Hoddog", label: "Hoddog" },
              { key: "Ichimlillar", label: "Ichimlillar" },
              { key: "Disertlar", label: "Disertlar" },
            ].map((c) => (
              <Button
                key={c.key}
                variant={categoryFilter === c.key ? "secondary" : "ghost"}
                className="text-white"
                onClick={() => {
                  setCategoryFilter(c.key);
                  setCurrentPage(1);
                }}
              >
                {c.label}
              </Button>
            ))}
          </div>

          {/* Products Grid with pagination */}
          <div className="px-4">
            {productsError ? (
              <div className="text-center text-red-300 bg-red-500/10 border border-red-500/30 rounded-md p-4">
                {productsError}
              </div>
            ) : loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-48 rounded-lg bg-white/10 animate-pulse"
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
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                          {pageItems.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              onAddToCart={addToCart}
                            />
                          ))}
                        </div>
                      )}

                      {/* Pagination */}
                      {(() => {
                        const totalItems = all.length;
                        const totalPages =
                          Math.ceil(totalItems / itemsPerPage) || 1;
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
                              className="text-white"
                            >
                              Oldingi
                            </Button>
                            <span className="text-gray-300 text-sm sm:text-base">
                              {currentPage} / {totalPages}
                            </span>
                            <Button
                              variant="ghost"
                              disabled={!canNext}
                              onClick={() =>
                                canNext && setCurrentPage((p) => p + 1)
                              }
                              className="text-white"
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
              <Card className=" w-[15rem] flex flex-col justify-start bg-gradient-to-r to-gray-600/80 backdrop-blur-lg border-orange-500/90">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-center text-lg">
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
                        className="space-y-1 border-b border-white/30 py-2"
                      >
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">
                            {item.name} x{item.quantity}
                          </span>
                          <span className="text-orange-200 font-medium">
                            {(item.price * item.quantity).toLocaleString()} so'm
                          </span>
                        </div>
                        <div className="flex justify-end">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
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
                      </div>
                    );
                  })}
                  <div className="border-t border-white/80 pt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Jami:</span>
                      <span className="text-orange-100">
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
      <MiniChat messages={messages} /> {/* MiniChat MainLayout ichiga ko'chirildi */}
    </div>
  );
}

export default App;