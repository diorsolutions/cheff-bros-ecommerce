import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

// VAPID Public Key (o'zingiznikini kiriting!)
// Bu kalitni `npx web-push generate-vapid-keys` buyrug'i orqali olishingiz mumkin.
// !!! Quyidagi qiymatni O'ZINGIZNING GENERATSIYA QILGAN TO'LIQ VAPID PUBLIC KEY'INGIZ BILAN ALMASHTIRING !!!
const VAPID_PUBLIC_KEY =
  "BD8Y10TFGCvYkzLiktWrzpo6VhXZW-YgbcIpYT2tnlq1tIrHQz-hRi-3XDX2KPy_-8raVkVNs5DbmqqKHvOlTx0"; // Bu yerga o'zingizning public kalitingizni qo'ying!

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(customerPhone) {
  const { toast } = useToast();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(
    Notification.permission === "granted"
  );

  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Workers brauzerda qo'llab-quvvatlanmaydi.");
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log("Service Worker ro'yxatdan o'tgan:", registration);
      return registration;
    } catch (error) {
      console.error("Service Worker ro'yxatdan o'tkazishda xatolik:", error);
      return null;
    }
  }, []);

  const subscribeUser = useCallback(
    async (registration) => {
      if (!registration) return;

      try {
        const existingSubscription =
          await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
          console.log("Mavjud push obunasi:", existingSubscription);
          return existingSubscription;
        }

        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        setSubscription(newSubscription);
        setIsSubscribed(true);
        console.log("Yangi push obunasi:", newSubscription);
        return newSubscription;
      } catch (error) {
        console.error("Push obunasini yaratishda xatolik:", error);
        setIsSubscribed(false);
        setSubscription(null);
        toast({
          title: "Bildirishnoma xatosi",
          description:
            "Push bildirishnomalarga obuna bo'lishda xatolik yuz berdi.",
          variant: "destructive",
        });
        return null;
      }
    },
    [toast]
  );

  const saveSubscriptionToSupabase = useCallback(
    async (sub, phone) => {
      if (!sub || !phone) return;

      const { endpoint, keys } = sub.toJSON();
      const { p256dh, auth } = keys;

      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          customer_phone: phone,
          endpoint: endpoint,
          p256dh: p256dh,
          auth: auth,
          user_agent: navigator.userAgent,
          platform: navigator.platform,
        },
        { onConflict: "endpoint" } // Agar endpoint mavjud bo'lsa, yangilash
      );

      if (error) {
        console.error("Obunani Supabasega saqlashda xatolik:", error);
        toast({
          title: "Xatolik",
          description: "Bildirishnoma obunasini saqlashda xatolik yuz berdi.",
          variant: "destructive",
        });
      } else {
        console.log("Push obunasi Supabasega saqlandi/yangilandi.");
      }
    },
    [toast]
  );

  const requestNotificationPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      toast({
        title: "Bildirishnoma xatosi",
        description: "Brauzeringiz bildirishnomalarni qo'llab-quvvatlamaydi.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "granted") {
      setPermissionGranted(true);
      const registration = await registerServiceWorker();
      const sub = await subscribeUser(registration);
      if (sub && customerPhone) {
        await saveSubscriptionToSupabase(sub, customerPhone);
      }
      return;
    }

    if (Notification.permission === "denied") {
      setPermissionGranted(false);
      toast({
        title: "Bildirishnoma ruxsati rad etildi",
        description:
          "Push bildirishnomalarini olish uchun brauzer sozlamalaridan ruxsat berishingiz kerak.",
        variant: "destructive",
      });
      return;
    }

    // Ruxsat so'rash
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPermissionGranted(true);
      const registration = await registerServiceWorker();
      const sub = await subscribeUser(registration);
      if (sub && customerPhone) {
        await saveSubscriptionToSupabase(sub, customerPhone);
      }
    } else {
      setPermissionGranted(false);
      toast({
        title: "Bildirishnoma ruxsati rad etildi",
        description:
          "Push bildirishnomalarini olish uchun ruxsat berishingiz kerak.",
      });
    }
  }, [
    customerPhone,
    registerServiceWorker,
    subscribeUser,
    saveSubscriptionToSupabase,
    toast,
  ]);

  useEffect(() => {
    if (customerPhone && Notification.permission === "granted") {
      requestNotificationPermission();
    }
  }, [customerPhone, requestNotificationPermission]);

  // Foydalanuvchi telefon raqami o'zgarganda obunani yangilash
  useEffect(() => {
    if (isSubscribed && subscription && customerPhone) {
      saveSubscriptionToSupabase(subscription, customerPhone);
    }
  }, [customerPhone, isSubscribed, subscription, saveSubscriptionToSupabase]);

  return { requestNotificationPermission, isSubscribed, permissionGranted };
}
