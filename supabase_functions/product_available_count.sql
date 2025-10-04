CREATE OR REPLACE FUNCTION public.product_available_count(product_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    min_possible_products INTEGER := 2147483647; -- Max integer value
    current_ingredient_stock NUMERIC;
    quantity_needed_for_product NUMERIC;
    possible_from_this_ingredient INTEGER;
BEGIN
    -- Agar mahsulotga bog'langan masalliqlar bo'lmasa, 0 qaytaramiz
    IF NOT EXISTS (SELECT 1 FROM public.product_ingredients WHERE product_id = product_available_count.product_id) THEN
        RETURN 0;
    END IF;

    FOR current_ingredient_stock, quantity_needed_for_product IN
        SELECT
            i.stock_quantity,
            pi.quantity_needed
        FROM
            public.product_ingredients pi
        JOIN
            public.ingredients i ON pi.ingredient_id = i.id
        WHERE
            pi.product_id = product_available_count.product_id
    LOOP
        IF quantity_needed_for_product <= 0 THEN
            -- Agar masalliqdan 0 yoki manfiy miqdor kerak bo'lsa, bu mantiqsiz, hisobga olmaymiz
            CONTINUE;
        END IF;

        IF current_ingredient_stock IS NULL OR current_ingredient_stock <= 0 THEN
            -- Agar masalliq stoki yo'q bo'lsa, bu mahsulotni tayyorlab bo'lmaydi
            RETURN 0;
        END IF;

        possible_from_this_ingredient := FLOOR(current_ingredient_stock / quantity_needed_for_product);
        min_possible_products := LEAST(min_possible_products, possible_from_this_ingredient);
    END LOOP;

    IF min_possible_products = 2147483647 THEN
        -- Agar hech qanday masalliq topilmasa (bu holat yuqoridagi IF bilan qoplangan bo'lishi kerak, lekin xavfsizlik uchun)
        RETURN 0;
    END IF;

    RETURN min_possible_products;
END;
$function$;