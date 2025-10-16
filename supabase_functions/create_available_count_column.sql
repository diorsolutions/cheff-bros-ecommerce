-- Agar 'available_count' ustuni mavjud bo'lsa, uni o'chirish
ALTER TABLE public.products DROP COLUMN IF EXISTS available_count;

-- 'available_count' nomli oddiy ustunni yaratish
ALTER TABLE public.products ADD COLUMN available_count integer;

-- Mavjud mahsulotlar uchun dastlabki qiymatlarni hisoblash va o'rnatish
UPDATE public.products
SET available_count = public.product_available_count(id);