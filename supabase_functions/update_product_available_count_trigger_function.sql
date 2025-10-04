CREATE OR REPLACE FUNCTION public.update_product_available_count()
RETURNS TRIGGER AS $$
DECLARE
    _product_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'ingredients' THEN
        -- Agar ingredients jadvali o'zgarsa, bog'langan barcha mahsulotlarni topish
        FOR _product_id IN SELECT DISTINCT product_id FROM public.product_ingredients WHERE ingredient_id = NEW.id OR OLD.id LOOP
            UPDATE public.products
            SET available_count = public.product_available_count(_product_id)
            WHERE id = _product_id;
        END LOOP;
    ELSIF TG_TABLE_NAME = 'product_ingredients' THEN
        -- Agar product_ingredients jadvali o'zgarsa, faqat shu mahsulotni yangilash
        _product_id := COALESCE(NEW.product_id, OLD.product_id);
        UPDATE public.products
        SET available_count = public.product_available_count(_product_id)
        WHERE id = _product_id;
    END IF;
    RETURN NULL; -- Triggerdan keyin hech narsa qaytarilmaydi
END;
$$ LANGUAGE plpgsql;