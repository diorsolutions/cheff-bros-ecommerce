-- Triggers on ingredients table
DROP TRIGGER IF EXISTS update_product_count_on_ingredients ON public.ingredients;
CREATE TRIGGER update_product_count_on_ingredients
AFTER INSERT OR UPDATE OR DELETE ON public.ingredients
FOR EACH ROW EXECUTE FUNCTION public.update_product_available_count();

-- Triggers on product_ingredients table
DROP TRIGGER IF EXISTS update_product_count_on_product_ingredients ON public.product_ingredients;
CREATE TRIGGER update_product_count_on_product_ingredients
AFTER INSERT OR UPDATE OR DELETE ON public.product_ingredients
FOR EACH ROW EXECUTE FUNCTION public.update_product_available_count();