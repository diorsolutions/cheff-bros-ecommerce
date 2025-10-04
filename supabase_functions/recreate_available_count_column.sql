-- Agar 'available_count' ustuni mavjud bo'lsa, uni o'chirish
ALTER TABLE public.products DROP COLUMN IF EXISTS available_count;

-- 'available_count' nomli GENERATED ustunni qayta yaratish
-- Bu ustun 'product_available_count' funksiyasidan foydalanadi
ALTER TABLE public.products ADD COLUMN available_count integer GENERATED ALWAYS AS (public.product_available_count(id)) STORED;