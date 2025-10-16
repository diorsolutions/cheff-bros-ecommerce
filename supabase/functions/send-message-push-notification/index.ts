// @ts-nocheck - Bu fayl Deno muhitida ishlaydi, Deno global obyekti mavjud.
/// <reference types="deno/globals" />
/// <reference types="deno/globals" />
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import webpush from "npm:web-push@3.6.0";

// VAPID kalitlari environment o'zgaruvchilardan olinadi
// Supabase loyihangizda ularni sozlang:
// VAPID_PUBLIC_KEY
// VAPID_PRIVATE_KEY
// VAPID_SUBJECT (odatda "mailto:sizning_email@example.com")
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT"); // Masalan: "mailto:your-email@example.com"

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
    const { customer_phone, message_text } = await req.json();

    if (!customer_phone || !message_text) {
      return new Response("Mijoz telefon raqami va xabar matni majburiy", {
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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

    const notificationTitle = "Yangi xabar!";
    const notificationBody = message_text;

    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: "/vite.svg",
      url: "/",
      data: {
        type: "message",
        customerPhone: customer_phone,
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
        if (pushError.statusCode === 410 || pushError.statusCode === 404) {
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
