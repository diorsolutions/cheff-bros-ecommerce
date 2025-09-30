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
import AdminDashboard from "@/components/AdminDashboard";
import AdminProducts from "@/components/AdminProducts";
import MiniChat from "@/components/MiniChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useLocalStorage } from "@/hooks/useLocalStorage";

function App() {
  const [view, setView] = useState("menu"); // 'menu' or 'admin'
  const [adminView, setAdminView] = useState("orders"); // 'orders' or 'products'
  const [cartItems, setCartItems] = useState([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [customerInfo, setCustomerInfo] = useLocalStorage("customerInfo", {
    name: "",
    phone: "",
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (productsError)
        console.error("Error fetching products:", productsError);
      else setProducts(productsData || []);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (ordersError) console.error("Error fetching orders:", ordersError);
      else setOrders(ordersData || []);
    };

    fetchInitialData();

    const productChannel = supabase
      .channel("realtime-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        (payload) => {
          console.log("Product change:", payload);
          if (payload.eventType === "INSERT") {
            setProducts((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setProducts((prev) =>
              prev.map((p) => (p.id === payload.new.id ? payload.new : p))
            );
          } else if (payload.eventType === "DELETE") {
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log("Product channel status:", status);
      });

    const orderChannel = supabase
      .channel("realtime-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          console.log("Order change:", payload);
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
      .subscribe((status) => {
        console.log("Order channel status:", status);
      });

    const messageChannel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          console.log("Message change:", payload);
          if (
            customerInfo.phone &&
            payload.new.customer_phone === customerInfo.phone
          ) {
            setMessages((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe((status) => {
        console.log("Message channel status:", status);
      });

    return () => {
      supabase.removeChannel(productChannel);
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(messageChannel);
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

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
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
      if (newStatus === "confirmed") {
        const itemNames = order.items.map((item) => item.name).join(", ");
        message = `Sizning ${itemNames} nomli buyurtmalaringiz allaqachon tayyor va kurier ularni olib manzilingizga eltib berish uchun yo'lga chiqdi!`;
      } else if (newStatus === "cancelled") {
        message = `Hurmatli mijoz, uzur so'raymiz sizning buyurtmangiz bekor qilindi, sababini bilishni hohlasangiz quyidagi +998907254545 raqamiga qo'ngiroq qiling`;
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
        <Route
          path="/product/:id"
          element={<ProductDetail onAddToCart={addToCart} />}
        />
        <Route
          path="/"
          element={
            <MainLayout
              view={view}
              setView={setView}
              adminView={adminView}
              setAdminView={setAdminView}
              cartItems={cartItems}
              cartItemsCount={cartItemsCount}
              products={products}
              orders={orders}
              addToCart={addToCart}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              setIsOrderDialogOpen={setIsOrderDialogOpen}
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
      <MiniChat messages={messages} />
      <Toaster />
    </>
  );
}

function MainLayout({
  view,
  setView,
  adminView,
  setAdminView,
  cartItems,
  cartItemsCount,
  products,
  orders,
  addToCart,
  handleUpdateOrderStatus,
  setIsOrderDialogOpen,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setView("menu")}
            >
              <Store className="h-8 w-8 text-orange-400" />
              <h1 className="text-2xl font-bold text-white">Restoran</h1>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant={view === "menu" ? "secondary" : "ghost"}
                onClick={() => setView("menu")}
                className="text-white"
              >
                Menyu
              </Button>
              <Button
                variant={view === "admin" ? "secondary" : "ghost"}
                onClick={() => setView("admin")}
                className="text-white"
              >
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Button>

              {view === "menu" && (
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
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="w-full mx-auto max-w-[1367px]">
        {view === "menu" ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">
                Bizning Menyumiz
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Eng mazali va sifatli taomlarni tanlang. Barcha taomlar yangi
                ingredientlar bilan tayyorlanadi.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-6 px-5">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
            </div>
            {cartItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-6 left-6 z-20"
              >
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-lg border-orange-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-lg">Savat</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4">
                    {cartItems.map((item, index) => {
                      const currentProduct = products.find(
                        (p) => p.id === item.id
                      );
                      const stock = currentProduct?.stock || 0;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">
                              {item.name} x{item.quantity}
                            </span>
                            <span className="text-orange-400 font-medium">
                              {(item.price * item.quantity).toLocaleString()}{" "}
                              so'm
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
                    <div className="border-t border-white/20 pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">Jami:</span>
                        <span className="text-orange-400">
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
        ) : (
          <div className="flex gap-12">
            <aside
              className={`transition-all duration-300 ${
                isSidebarOpen ? "w-64" : "w-14"
              } border-r border-white/30`}
            >
              <nav className="flex flex-col items-start justify-start w-full sticky top-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="justify-end ml-[-4px]"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  {isSidebarOpen ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <PanelRightClose className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant={adminView === "orders" ? "secondary" : "ghost"}
                  className=""
                  onClick={() => setAdminView("orders")}
                >
                  <ListOrdered className="mr-3 h-5 w-5" />
                  {isSidebarOpen && "Buyurtmalar"}
                </Button>
                <Button
                  variant={adminView === "products" ? "secondary" : "ghost"}
                  className=""
                  onClick={() => setAdminView("products")}
                >
                  <Utensils className="mr-3 h-5 w-5" />
                  {isSidebarOpen && "Mahsulotlar"}
                </Button>
              </nav>
            </aside>
            <motion.div
              className="flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {adminView === "orders" ? (
                <AdminDashboard
                  orders={orders}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              ) : (
                <AdminProducts products={products} />
              )}
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
