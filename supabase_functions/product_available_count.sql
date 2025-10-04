CREATE OR REPLACE FUNCTION public.product_available_count(p_product_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_min_possible_products integer := 2147483647; -- PostgreSQL'dagi maksimal INTEGER qiymati
    v_ingredient_count integer;
    v_product_exists boolean;
BEGIN
    -- Mahsulot mavjudligini tekshirish
    SELECT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) INTO v_product_exists;
    IF NOT v_product_exists THEN
        RETURN 0;
    END IF;

    -- Bu mahsulotga bog'langan masalliqlar sonini olish
    SELECT COUNT(*)
    FROM public.product_ingredients
    WHERE product_id = p_product_id
    INTO v_ingredient_count;

    IF v_ingredient_count = 0 THEN
        -- Agar masalliqlar bog'lanmagan bo'lsa, 0 stok deb hisoblaymiz (tayyorlab bo'lmaydi)
        RETURN 0;
    END IF;

    -- Har bir masalliqdan qancha mahsulot tayyorlash mumkinligini hisoblash
    -- va ularning ichidan eng kichigini olish
    SELECT MIN(FLOOR(i.stock_quantity / pi.quantity_needed))
    FROM public.product_ingredients pi
    JOIN public.ingredients i ON pi.ingredient_id = i.id
    WHERE pi.product_id = p_product_id
      AND pi.quantity_needed > 0 -- Noldan yoki manfiy songa bo'linmaslik uchun
      AND i.stock_quantity IS NOT NULL
      AND i.stock_quantity >= 0 -- Stok manfiy emasligini ta'minlash
    INTO v_min_possible_products;

    -- Agar MIN NULL qaytarsa (masalan, mos keladigan masalliqlar yo'q bo'lsa)
    -- yoki hisoblangan miqdor manfiy bo'lsa, 0 qaytaramiz.
    IF v_min_possible_products IS NULL OR v_min_possible_products < 0 THEN
        RETURN 0;
    END IF;

    RETURN v_min_possible_products;
END;
$$;