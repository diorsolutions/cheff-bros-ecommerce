import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
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
  Salad,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import OrderDialog from "@/components/OrderDialog";
import Dashboard from "@/components/Dashboard";
import AdminLoginPage from "@/components/AdminLoginPage";
import CurierLoginPage from "@/components/CurierLoginPage";
import ChefLoginPage from "@/components/ChefLoginPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedRouteCurier from "@/components/ProtectedRouteCurier";
import ProtectedRouteChef from "@/components/ProtectedRouteChef";
import MiniChat from "@/components/MiniChat";
import ClientOrderStatusModal from "@/components/ClientOrderStatusModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast"; // Xato shu yerda edi, to'g'rilandi
import { supabase } from "@/lib/supabase";
import CurierInterFace from "./components/curier/CurierInterFace";
import ChefInterface from "./components/chef/ChefInterface";
import AdminDashboard from "@/components/AdminDashboard";
import AdminProducts from "@/components/AdminProducts"; // <-- Bu qator qo'shildi
import AdminIngredients from "@/components/AdminIngredients"; // <-- Bu qator qo'shildi
import AdminStatistics from "@/components/AdminStatistics"; // <-- Bu qator qo'shildi
import AdminCouriers from "@/components/AdminCouriers"; // <-- Bu qator qo'shildi
import AdminChefs from "@/components/AdminChefs"; // <-- Bu qator qo'shildi
import { useWindowSize } from "react-use";
import { generateShortOrderId, formatPrice } from "@/lib/utils";
import { calculateProductStock } from "@/utils/stockCalculator";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePushNotifications } from "@/hooks/usePushNotifications";

function App() {
  const [cartItems, setCartItems] = useLocalStorage("cartItems", []);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [curiers, setCuriers] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [productIngredients, setProductIngredients] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [customerInfo, setCustomerInfo] = useLocalStorage("customerInfo", {
    name: "",
    phone: "",
  });
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [activeCustomerOrderIds, setActiveCustomerOrderIds] = useLocalStorage(
    "activeCustomerOrderIds",
    []
  );

  const clientMessageSound = useRef(
    new Audio("/notification_client_message.mp3")
  );

  const { requestNotificationPermission, isSubscribed, permissionGranted } =
    usePushNotifications(customerInfo.phone);

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
            setProducts(fallbackData || []);
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
            setOrders(fbOrders || []);
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

      try {
        const { data: chefsData, error: chefsErr } = await supabase
          .from("chefs")
          .select("id, name, phone");
        if (chefsErr) {
          console.error("Oshpazlarni yuklashda xatolik:", chefsErr);
        } else {
          setChefs(chefsData || []);
        }
      } catch (e) {
        console.error("Oshpazlarni yuklashda kutilmagan xatolik:", e);
      }

      try {
        const { data: ingredientsData, error: ingredientsErr } = await supabase
          .from("ingredients")
          .select("*");
        if (ingredientsErr) {
          console.error("Masalliqlarni yuklashda xatolik:", ingredientsErr);
        } else {
          setIngredients(ingredientsData || []);
        }
      } catch (e) {
        console.error("Masalliqlarni yuklashda kutilmagan xatolik:", e);
      }

      try {
        const { data: productIngredientsData, error: productIngredientsErr } =
          await supabase.from("product_ingredients").select("*");
        if (productIngredientsErr) {
          console.error(
            "Mahsulot-masalliq bog'lanishlarini yuklashda xatolik:",
            productIngredientsErr
          );
        } else {
          setProductIngredients(productIngredientsData || []);
        }
      } catch (e) {
        console.error(
          "Mahsulot-masalliq bog'lanishlarini kutilmagan xatolik:",
          e
        );
      }
    };

    fetchInitialData();

    let productChannel,
      orderChannel,
      messageChannel,
      curierChannel,
      chefChannel,
      ingredientChannel,
      productIngredientChannel;

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
            } else if (payload.eventType === "UPDATE") {
              setOrders((prev) =>
                prev.map((o) => (o.id === payload.new.id ? payload.new : o))
              );
              if (
                payload.new.status === "delivered_to_customer" ||
                payload.new.status === "cancelled"
              ) {
                setActiveCustomerOrderIds((prevIds) =>
                  prevIds.filter((id) => id !== payload.new.id)
                );
              }
            } else if (payload.eventType === "DELETE") {
              setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
              setActiveCustomerOrderIds((prevIds) =>
                prevIds.filter((id) => id !== payload.old.id)
              );
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
              clientMessageSound.current
                .play()
                .catch((e) =>
                  console.error("Error playing client message sound:", e)
                );

              if (!isMiniChatOpen && permissionGranted) {
                fetch(
                  `${supabase.url}/functions/v1/send-message-push-notification`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      customer_phone: payload.new.customer_phone,
                      message_text: payload.new.text,
                    }),
                  }
                )
                  .then((response) => {
                    if (!response.ok) {
                      console.error(
                        "Failed to send push notification for message:",
                        response.statusText
                      );
                    }
                  })
                  .catch((error) => {
                    console.error(
                      "Error sending push notification for message:",
                      error
                    );
                  });
              }

              toast({
                title: "Yangi xabar!",
                description: payload.new.text,
                action: (
                  <Button
                    variant="ghost"
                    className="text-white bg-orange-500 hover:bg-orange-600"
                    onClick={() => setIsMiniChatOpen(true)}
                  >
                    Ko'rish
                  </Button>
                ),
                duration: 5000,
              });
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

    try {
      chefChannel = supabase
        .channel("realtime-chefs")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chefs" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setChefs((prev) => [...prev, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setChefs((prev) =>
                prev.map((c) => (c.id === payload.new.id ? payload.new : c))
              );
            } else if (payload.eventType === "DELETE") {
              setChefs((prev) => prev.filter((c) => c.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.error("Error subscribing to chef real-time channel:", e);
    }

    try {
      ingredientChannel = supabase
        .channel("realtime-ingredients")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ingredients" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setIngredients((prev) => [...prev, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setIngredients((prev) =>
                prev.map((i) => (i.id === payload.new.id ? payload.new : i))
              );
            } else if (payload.eventType === "DELETE") {
              setIngredients((prev) =>
                prev.filter((i) => i.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.error("Error subscribing to ingredient real-time channel:", e);
    }

    try {
      productIngredientChannel = supabase
        .channel("realtime-product_ingredients")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "product_ingredients" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setProductIngredients((prev) => [...prev, payload.new]);
            } else if (payload.eventType === "UPDATE") {
              setProductIngredients((prev) =>
                prev.map((pi) =>
                  pi.product_id === payload.new.product_id &&
                  pi.ingredient_id === payload.new.ingredient_id
                    ? payload.new
                    : pi
                )
              );
            } else if (payload.eventType === "DELETE") {
              setProductIngredients((prev) =>
                prev.filter(
                  (pi) =>
                    !(
                      pi.product_id === payload.old.product_id &&
                      pi.ingredient_id === payload.old.ingredient_id
                    )
                )
              );
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.error(
        "Mahsulot-masalliq bog'lanishlarini kutilmagan xatolik:",
        e
      );
    }

    return () => {
      if (productChannel) supabase.removeChannel(productChannel);
      if (orderChannel) supabase.removeChannel(orderChannel);
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (curierChannel) supabase.removeChannel(curierChannel);
      if (chefChannel) supabase.removeChannel(chefChannel);
      if (ingredientChannel) supabase.removeChannel(ingredientChannel);
      if (productIngredientChannel)
        supabase.removeChannel(productIngredientChannel);
    };
  }, [customerInfo.phone, permissionGranted]);

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
            ? {
                ...item,
                quantity: item.quantity + product.quantity,
                customizations: product.customizations || {},
                ingredients: product.ingredients || [],
              }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          customizations: product.customizations || {},
          ingredients: product.ingredients || [],
        },
      ];
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
    const {
      customer,
      items,
      location,
      coordinates,
      totalPrice,
      deliveryOption,
    } = orderData;

    for (const item of items) {
      const productInState = products.find((p) => p.id === item.id);
      if (!productInState) {
        toast({
          title: "Xatolik!",
          description: `${item.name} mahsuloti topilmadi.`,
          variant: "destructive",
        });
        return;
      }

      let availableStock;
      if (productInState.manual_stock_enabled) {
        availableStock = productInState.manual_stock_quantity;
      } else {
        const tempProductIngredients = productIngredients.map((pi) => {
          if (
            item.customizations &&
            item.customizations[pi.ingredient_id] !== undefined
          ) {
            return {
              ...pi,
              quantity_needed: item.customizations[pi.ingredient_id],
            };
          }
          return pi;
        });
        availableStock = calculateProductStock(
          item.id,
          products,
          ingredients,
          tempProductIngredients
        );
      }

      if (availableStock < item.quantity) {
        toast({
          title: "Xatolik!",
          description: `${item.name} mahsulotini tayyorlash uchun yetarli masalliq yo'q. Hozirda ${availableStock} dona tayyorlash mumkin.`,
          variant: "destructive",
        });
        return;
      }
    }

    setCustomerInfo(customer);

    for (const item of items) {
      const productInState = products.find((p) => p.id === item.id);
      if (productInState.manual_stock_enabled) {
        const newManualStock =
          productInState.manual_stock_quantity - item.quantity;
        await supabase
          .from("products")
          .update({ manual_stock_quantity: newManualStock })
          .eq("id", item.id);
      } else {
        const productIngredientsNeeded = productIngredients.filter(
          (pi) => pi.product_id === item.id
        );
        for (const prodIng of productIngredientsNeeded) {
          const ingredient = ingredients.find(
            (ing) => ing.id === prodIng.ingredient_id
          );
          if (ingredient) {
            let quantityToDeduct = prodIng.quantity_needed;
            if (
              item.customizations &&
              item.customizations[prodIng.ingredient_id] !== undefined
            ) {
              quantityToDeduct = item.customizations[prodIng.ingredient_id];
            }

            const newStock =
              ingredient.stock_quantity - quantityToDeduct * item.quantity;
            await supabase
              .from("ingredients")
              .update({ stock_quantity: newStock })
              .eq("id", ingredient.id);
          }
        }
      }
    }

    const { error: orderError, data: insertedOrder } = await supabase
      .from("orders")
      .insert([
        {
          customer_info: customer,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            customizations: item.customizations || {},
          })),
          location,
          coordinates,
          total_price: totalPrice,
          status: "new",
          delivery_option: deliveryOption,
        },
      ])
      .select("id")
      .single();

    if (orderError) {
      toast({
        title: "Xatolik!",
        description: "Buyurtma yuborishda xatolik yuz berdi.",
        variant: "destructive",
      });
      return;
    }

    const shortOrderId = generateShortOrderId(insertedOrder.id);

    setActiveCustomerOrderIds((prevIds) => [...prevIds, insertedOrder.id]);

    setCartItems([]);
    toast({
      title: "Buyurtma qabul qilindi!",
      description: `Sizning buyurtmangiz muvaffaqiyatli yuborildi. ID: ${shortOrderId}`,
    });
  };

  const handleUpdateOrderStatus = async (
    orderId,
    newStatus,
    actorId = null,
    actorRole = null,
    cancellationReason = null
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

    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }

    if (actorRole === "curier") {
      if (orderToUpdate.curier_id && orderToUpdate.curier_id !== actorId) {
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
          if (
            (orderToUpdate.status === "preparing" ||
              orderToUpdate.status === "ready") &&
            !orderToUpdate.curier_id
          ) {
            canUpdate = true;
            updateData.curier_id = actorId;
            delete updateData.status;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma hali tayyorlanmoqda/tayyor emas yoki allaqachon kuryerga biriktirilgan.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "picked_up_from_kitchen":
          if (
            orderToUpdate.status === "ready" &&
            orderToUpdate.curier_id === actorId
          ) {
            canUpdate = true;
            updateData.status = newStatus;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma hali oshpaz tomonidan tayyorlanmagan yoki boshqa kuryerga biriktirilgan.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "delivered_to_customer":
        case "cancelled":
          if (
            orderToUpdate.status === "picked_up_from_kitchen" &&
            orderToUpdate.curier_id === actorId
          ) {
            canUpdate = true;
            updateData.status = newStatus;
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
    } else if (actorRole === "chef") {
      switch (newStatus) {
        case "preparing":
          if (orderToUpdate.status === "new") {
            if (!orderToUpdate.chef_id) {
              canUpdate = true;
              updateData.chef_id = actorId;
              updateData.status = newStatus;
            } else if (orderToUpdate.chef_id === actorId) {
              canUpdate = true;
              updateData.status = newStatus;
            } else {
              toast({
                title: "Xatolik!",
                description:
                  "Bu buyurtma allaqachon boshqa oshpaz tomonidan qabul qilingan.",
                variant: "destructive",
              });
              return;
            }
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma allaqachon tayyorlanmoqda yoki boshqa statusda.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "ready":
          if (
            orderToUpdate.status === "preparing" &&
            orderToUpdate.chef_id === actorId
          ) {
            canUpdate = true;
            updateData.status = newStatus;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma hali tayyorlanmagan yoki boshqa oshpazga biriktirilgan.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "delivered_to_customer":
          if (
            orderToUpdate.status === "ready" &&
            orderToUpdate.chef_id === actorId &&
            orderToUpdate.delivery_option === "o_zim_olib_ketaman"
          ) {
            canUpdate = true;
            updateData.status = newStatus;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma hali tayyor emas, oshpazga biriktirilmagan yoki yetkazib berish buyurtmasi.",
              variant: "destructive",
            });
            return;
          }
          break;
        case "cancelled":
          if (
            orderToUpdate.status !== "delivered_to_customer" &&
            orderToUpdate.status !== "cancelled" &&
            (!orderToUpdate.chef_id || orderToUpdate.chef_id === actorId)
          ) {
            canUpdate = true;
            updateData.chef_id = actorId;
            updateData.curier_id = null;
            updateData.status = newStatus;
          } else {
            toast({
              title: "Xatolik!",
              description:
                "Buyurtma bekor qilinishi mumkin emas (allaqachon yakunlangan bo'lishi mumkin).",
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
      if (orderToUpdate.curier_id || orderToUpdate.chef_id) {
        toast({
          title: "Xatolik!",
          description:
            "Bu buyurtma kuryer yoki oshpazga biriktirilgan. Faqat ular o'zgartira oladi.",
          variant: "destructive",
        });
        return;
      }
      canUpdate = true;

      if (
        (newStatus === "preparing" || newStatus === "ready") &&
        !orderToUpdate.chef_id
      ) {
        if (chefs.length > 0) {
          updateData.chef_id = chefs[0].id;
        } else {
          toast({
            title: "Xatolik!",
            description:
            "Oshpazlar topilmadi. Buyurtmani tayyorlash uchun oshpaz kerak.",
            variant: "destructive",
          });
          return;
        }
      }
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
      if (newStatus === "delivered_to_customer") {
        const itemNames = order.items
          .map((item) => `*${item.name}*`)
          .join(", ");
        if (order.delivery_option === "o_zim_olib_ketaman") {
          message = `Sizning ${itemNames} nomli buyurtmangiz tayyor va topshirildi!`;
        } else {
          message = `Sizning ${itemNames} nomli buyurtmalaringiz muvaffaqiyatli yetkazib berildi!`;
        }
      } else if (newStatus === "cancelled") {
        message = `Hurmatli mijoz, uzur so'raymiz sizning buyurtmangiz bekor qilindi. Sababini bilishni hohlasangiz quyidagi +998907254545 raqamiga qo'ng'iroq qiling`;
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
    <div className="app-container">
      <Helmet>
        <title>Restoran - Online Buyurtma Tizimi</title>
        <meta
          name="description"
          content="Eng mazali taomlarni online buyurtma qiling. Tez va qulay yetkazib berish xizmati."
        />
      </Helmet>
      <Routes>
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/curier-login" element={<CurierLoginPage />} />
        <Route path="/chef-login" element={<ChefLoginPage />} />
        <Route
          path="/curier"
          element={
            <ProtectedRouteCurier>
              <CurierInterFace
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                chefs={chefs}
                curiers={curiers}
              />
            </ProtectedRouteCurier>
          }
        />
        <Route
          path="/chef"
          element={
            <ProtectedRouteChef>
              <ChefInterface
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                chefs={chefs}
                curiers={curiers}
                ingredients={ingredients}
              />
            </ProtectedRouteChef>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <AdminDashboard
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                curiers={curiers}
                chefs={chefs}
                ingredients={ingredients}
              />
            }
          />
          <Route
            path="orders"
            element={
              <AdminDashboard
                orders={orders}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                curiers={curiers}
                chefs={chefs}
                ingredients={ingredients}
              />
            }
          />
          <Route
            path="products"
            element={
              <AdminProducts
                products={products}
                allIngredients={ingredients}
                allProductIngredients={productIngredients}
              />
            }
          />
          <Route
            path="ingredients"
            element={
              <AdminIngredients
                allProducts={products}
                allIngredients={ingredients}
                allProductIngredients={productIngredients}
              />
            }
          />
          <Route
            path="statistics"
            element={
              <AdminStatistics
                orders={orders}
                products={products}
                curiers={curiers}
                chefs={chefs}
                ingredients={ingredients}
                productIngredients={productIngredients}
              />
            }
          />
          <Route
            path="couriers"
            element={<AdminCouriers curiers={curiers} orders={orders} />}
          />
          <Route
            path="chefs"
            element={<AdminChefs chefs={chefs} orders={orders} />}
          />
        </Route>
        <Route
          path="/product/:slug" /* ID o'rniga slug ni qabul qilamiz */
          element={
            <ProductDetail
              onAddToCart={addToCart}
              products={products}
              ingredients={ingredients}
              productIngredients={productIngredients}
              cartItems={cartItems}
            />
          }
        />
        <Route
          path="/"
          element={
            <div className="relative">
              <MemoizedMainLayout // MemoizedMainLayout dan foydalanish
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
                // messages={messages} // messages propini olib tashladik
                ingredients={ingredients}
                productIngredients={productIngredients}
                activeCustomerOrderIds={activeCustomerOrderIds}
                orders={orders}
                chefs={chefs}
                curiers={curiers}
                customerInfo={customerInfo}
                setCustomerInfo={setCustomerInfo}
                requestNotificationPermission={requestNotificationPermission}
                isSubscribed={isSubscribed}
                permissionGranted={permissionGranted}
              />
              {isMiniChatOpen && (
                <div
                  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                  onClick={() => setIsMiniChatOpen(false)}
                />
              )}
              <div className="fixed bottom-6 right-6 z-50">
                <MiniChat
                  messages={messages}
                  isPopoverOpen={isMiniChatOpen}
                  setIsPopoverOpen={setIsMiniChatOpen}
                />
              </div>
            </div>
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
        customerInfo={customerInfo}
        setCustomerInfo={setCustomerInfo}
      />
      <Toaster />
    </div>
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
  // messages, // messages propini olib tashladik
  ingredients,
  productIngredients,
  activeCustomerOrderIds,
  orders,
  chefs,
  curiers,
  customerInfo,
  requestNotificationPermission,
  isSubscribed,
  permissionGranted,
}) {
  const { width } = useWindowSize();

  // isMiniChatOpen ga bog'liq useEffect App.jsx ga ko'chirildi

  const handleAddToCart = (product, quantity) => {
    addToCart(product, quantity);

    if (width >= 1024) {
      toast({
        title: "Savatga qo'shildi!mi?",
        description: `${product.name} (${quantity} dona) savatga qo'shildi`,
      });
    }
  };

  const handleRequestNotification = () => {
    requestNotificationPermission();
  };

  return (
    <div className="min-h-screen bg-[#ffffff]">
      <Helmet>
        <title>Restoran - Online Buyurtma Tizimi</title>
        <meta
          name="description"
          content="Eng mazali taomlarni online buyurtma qiling. Tez va qulay yetkazib berish xizmati."
        />
      </Helmet>
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
              {!permissionGranted && (
                <Button
                  onClick={handleRequestNotification}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm px-3 py-1.5 rounded-md"
                >
                  Bildirishnomalarni yoqish
                </Button>
              )}
              {/* MiniChat bu yerdan olib tashlandi */}
              <Button
                onClick={() => setIsOrderDialogOpen(true)}
                disabled={cartItems.length === 0}
                className="mob_small:rounded-full extra_small:text-xs mob_xr:text-[.7rem] rounded-[.4rem] bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white relative"
              >
                <ShoppingCart className="h-3 w-3 mob_small:scale-x-150" />
                <span className="mob_small:hidden">Buyurtma berish</span>
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
      <main className="w-full mx-auto max-w-[1376px] bg-white/90 transition-filter duration-300">
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
                              allProducts={products}
                              allIngredients={ingredients}
                              allProductIngredients={productIngredients}
                              cartItems={cartItems}
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
                    return (
                      <div
                        key={index}
                        className="space-y-1 border-b border-gray-300 py-2"
                      >
                        <div className="flex gap-4 justify-between items-center text-sm">
                          <span className="text-gray-900 flex items-center gap-1">
                            {item.name}
                            <span className="font-bold text-black/60">
                              {item.quantity} ta
                            </span>
                          </span>
                          <span className="text-black font-medium">
                            {formatPrice(item.price * item.quantity)} so'm
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-800">Jami:</span>
                      <span className="text-orange-500">
                        {formatPrice(
                          cartItems.reduce(
                            (sum, item) => sum + item.price * item.quantity,
                            0
                          )
                        )}{" "}
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
      <ClientOrderStatusModal
        activeOrderIds={activeCustomerOrderIds}
        orders={orders}
        chefs={chefs}
        curiers={curiers}
        customerPhone={customerInfo.phone}
      />
      <Toaster />
    </div>
  );
}

const MemoizedMainLayout = React.memo(MainLayout);

export default App;