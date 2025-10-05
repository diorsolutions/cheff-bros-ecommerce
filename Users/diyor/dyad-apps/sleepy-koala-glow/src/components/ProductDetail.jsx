const ProductDetail = ({ onAddToCart, products, ingredients, productIngredients, cartItems }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [calculatedStock, setCalculatedStock] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        toast({
          title: "Xatolik!",
          description: "Mahsulot topilmadi",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setProduct(data);
      // Mahsulot yuklangandan so'ng stokni hisoblash
      const stock = calculateProductStock(data.id, products, ingredients, productIngredients);
      setCalculatedStock(stock);
      setLoading(false);
    };

    fetchProduct();

    // Faqat mahsulotning o'zgarishlarini kuzatish (realtime)
    const channel = supabase
      .channel(`product-${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            navigate("/");
          } else {
            setProduct(payload.new);
            // Realtime yangilanishda ham stokni qayta hisoblash
            const stock = calculateProductStock(payload.new.id, products, ingredients, productIngredients);
            setCalculatedStock(stock);
          }
        }
      )
      .subscribe();

    // Ingredients va productIngredients o'zgarganda ham stokni qayta hisoblash
    // Bu kanallar o'chirildi, chunki ular ortiqcha serverni o'g'rilashtiradi
    // const ingredientChannel = supabase
    //   .channel(`ingredient-changes-for-product-${id}`)
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "ingredients" },
    //     (payload) => {
    //       if (product) {
    //         const stock = calculateProductStock(product.id, products, ingredients, productIngredients);
    //         setCalculatedStock(stock);
    //       }
    //     }
    //   )
    //   .subscribe();

    // const productIngredientChannel = supabase
    //   .channel(`product_ingredient-changes-for-product-${id}`)
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "product_ingredients", filter: `product_id=eq.${id}` },
    //     (payload) => {
    //       if (product) {
    //         const stock = calculateProductStock(product.id, products, ingredients, productIngredients);
    //         setCalculatedStock(stock);
    //       }
    //     }
    //   )
    //   .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // supabase.removeChannel(ingredientChannel); // O'chirildi
      // supabase.removeChannel(productIngredientChannel); // O'chirildi
    };
  }, [id, navigate]); // product ham dependency ga qo'shildi, lekin bu xato bo'lishi mumkin

};