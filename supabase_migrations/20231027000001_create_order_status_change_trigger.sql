CREATE OR REPLACE FUNCTION public.handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    response_status int;
    response_body text;
BEGIN
    -- Faqat status 'delivered_to_customer' yoki 'cancelled' ga o'zgarganda ishga tushirish
    IF NEW.status = 'delivered_to_customer' OR NEW.status = 'cancelled' THEN
        SELECT
            INTO response_status, response_body
            status, content
        FROM
            net.http_post(
                url := 'http://localhost:54321/functions/v1/send-push-notification', -- Local development uchun
                -- Production uchun Supabase Edge Function URL'ini kiriting:
                -- url := 'https://YOUR_SUPABASE_PROJECT_REF.supabase.co/functions/v1/send-push-notification',
                headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.arr', true)::json->>0 || '"}'::jsonb,
                body := json_build_object('record', NEW)
            );

        RAISE NOTICE 'Push notification Edge Function chaqirildi. Status: %, Body: %', response_status, response_body;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger yaratish
CREATE OR REPLACE TRIGGER on_order_status_update
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_status_change();

-- Trigger'ni ishga tushirish uchun ruxsat berish
ALTER FUNCTION public.handle_order_status_change() SET search_path = public, extensions;