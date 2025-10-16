CREATE TABLE public.push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_phone text NOT NULL,
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_agent text,
    platform text
    -- FOREIGN KEY (customer_phone) REFERENCES public.customers(phone) ON DELETE CASCADE -- Bu qator olib tashlandi
);

-- `customer_phone` ustuniga indeks qo'shish tez qidiruv uchun
CREATE INDEX idx_push_subscriptions_customer_phone ON public.push_subscriptions (customer_phone);

-- RLS (Row Level Security) ni yoqish
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policy'ni soddalashtiramiz, chunki bizda `customer_info.phone` bor, `auth.uid()` emas.
-- Bu policy faqat `customer_phone` ga asoslanadi.
-- DIQQAT: Bu policy xavfsizlikni kamaytirishi mumkin, chunki har kim istalgan telefon raqami uchun obuna qo'shishi mumkin.
-- Haqiqiy ilovada, foydalanuvchi autentifikatsiyasini tekshirish kerak.
DROP POLICY IF EXISTS "Allow authenticated users to manage their own subscriptions" ON public.push_subscriptions;

CREATE POLICY "Allow insert for all users"
ON public.push_subscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow select for all users"
ON public.push_subscriptions FOR SELECT
USING (true);

CREATE POLICY "Allow delete for all users"
ON public.push_subscriptions FOR DELETE
USING (true);