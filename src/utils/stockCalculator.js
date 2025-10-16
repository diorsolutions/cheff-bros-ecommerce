export const calculateProductStock = (productId, allProducts, allIngredients, allProductIngredients) => {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return 0;

  const ingredientsForProduct = allProductIngredients.filter(pi => pi.product_id === productId);

  if (ingredientsForProduct.length === 0) {
    // Agar mahsulotga hech qanday masalliq bog'lanmagan bo'lsa, cheksiz deb hisoblaymiz yoki 0
    // Hozircha 0 qaytaramiz, chunki masalliqsiz mahsulot tayyorlab bo'lmaydi
    return 0;
  }

  let maxPossibleProducts = Infinity;

  for (const prodIng of ingredientsForProduct) {
    const ingredient = allIngredients.find(ing => ing.id === prodIng.ingredient_id);

    if (!ingredient || ingredient.stock_quantity === null || ingredient.stock_quantity <= 0) {
      // Agar masalliq topilmasa yoki stoki yo'q bo'lsa, bu mahsulotni tayyorlab bo'lmaydi
      return 0;
    }

    if (prodIng.quantity_needed <= 0) {
      // Agar masalliqdan 0 yoki manfiy miqdor kerak bo'lsa, bu mantiqsiz, hisobga olmaymiz
      continue;
    }

    const possibleFromThisIngredient = Math.floor(ingredient.stock_quantity / prodIng.quantity_needed);
    maxPossibleProducts = Math.min(maxPossibleProducts, possibleFromThisIngredient);
  }

  return maxPossibleProducts === Infinity ? 0 : maxPossibleProducts;
};