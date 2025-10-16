// @ts-nocheck - Bu fayl Deno muhitida ishlaydi, Deno global obyekti mavjud.
/// <reference types="deno/globals" />
/// <reference types="deno/globals" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7"; // web-push kutubxonasini import qilish

// Deno muhitida bajarilayotganligini tasdiqlash uchun
// Agar TS xatolik berse, uni bekor qilish uchun yuqoridagi "@ts-nocheck" dan foydalaning.

// VAPID kalitlari environment o'zgaruvchilardan olinadi
// Supabase loyihangizda ularni sozlang:
// VAPID_PUBLIC_KEY
// VAPID_PRIVATE_KEY
// VAPID_SUBJECT (odatda "mailto:sizning_email@example.com")
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT"); // Masalan: "mailto:your-email@example.com"
// what is this
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
  console.error("VAPID kalitlari yoki subject sozlanmagan!");
  // Production muhitida bu xato bilan chiqish kerak
} else {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { record } = await req.json();
    const {
      id: order_id,
      customer_info,
      delivery_option,
      status,
      items,
    } = record;
    const customer_phone = customer_info?.phone;

    if (!customer_phone) {
      console.warn("Mijoz telefon raqami topilmadi:", record);
      return new Response("Mijoz telefon raqami topilmadi", { status: 400 });
    }

    // Supabase client'ini yaratish
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Mijozning push obunalarini olish
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("*")
      .eq("customer_phone", customer_phone);

    if (subError) {
      console.error("Push obunalarini olishda xatolik:", subError);
      return new Response(JSON.stringify({ error: subError.message }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`Mijoz ${customer_phone} uchun push obunalari topilmadi.`);
      return new Response("Push obunalari topilmadi", { status: 200 });
    }

    let notificationTitle = "Buyurtma yangilandi!";
    let notificationBody = "";
    const itemNames = items.map((item) => item.name).join(", ");

    if (status === "delivered_to_customer") {
      if (delivery_option === "o_zim_olib_ketaman") {
        notificationBody = `Sizning "${itemNames}" nomli buyurtmangiz tayyor va topshirildi!`;
      } else {
        notificationBody = `Sizning "${itemNames}" nomli buyurtmangiz yetkazib berildi!`;
      }
    } else if (status === "cancelled") {
      notificationBody = `Sizning "${itemNames}" nomli buyurtmangiz bekor qilindi.`;
    } else {
      // Boshqa statuslar uchun ham xabar yuborish mumkin, lekin hozircha faqat delivered/cancelled
      console.log(`Status ${status} uchun push notification yuborilmaydi.`);
      return new Response("Status push notification uchun mos emas", {
        status: 200,
      });
    }

    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: "/vite.svg", // Yo'l /public/vite.svg dan /vite.svg ga o'zgartirildi
      url: "/", // Bildirishnoma bosilganda ochiladigan URL
      data: {
        orderId: order_id,
        status: status,
      },
    });

    const pushPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        console.log("Push notification yuborildi:", sub.endpoint);
      } catch (pushError) {
        console.error("Push notification yuborishda xatolik:", pushError);
        // Agar obuna yaroqsiz bo'lsa, uni o'chirib tashlash
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
          // GONE or NOT_FOUND
          console.log("Yaroqsiz obuna o'chirilmoqda:", sub.endpoint);
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
      }
    });

    await Promise.all(pushPromises);

    return new Response("Push notificationlar yuborildi", {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Edge Function xatosi:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
