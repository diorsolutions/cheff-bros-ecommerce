import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  created_at: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image?: File | null; // For new uploads
  image_url?: string | null; // For existing images
}

const BUCKET_NAME = 'product-images';

// Fetch all products
export const getProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

// Add a new product
export const addProduct = async (formData: ProductFormData): Promise<Product> => {
  let imageUrl: string | null = null;

  if (formData.image) {
    const file = formData.image;
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;
    
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    imageUrl = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from('products')
    .insert({
      name: formData.name,
      description: formData.description,
      price: formData.price,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update an existing product
export const updateProduct = async (id: string, formData: ProductFormData): Promise<Product> => {
  let imageUrl: string | null | undefined = formData.image_url; // Keep existing URL by default

  if (formData.image) {
    const file = formData.image;
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Optionally delete old image if it exists
    if (formData.image_url) {
      const oldFileName = formData.image_url.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true, // Use upsert to overwrite if file name is the same (though we use UUID)
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    imageUrl = publicUrlData.publicUrl;
  } else if (formData.image_url === null) {
    // If image was explicitly removed (e.g., by clearing the input)
    if (formData.image_url) {
      const oldFileName = formData.image_url.split('/').pop();
      if (oldFileName) {
        await supabase.storage.from(BUCKET_NAME).remove([oldFileName]);
      }
    }
    imageUrl = null;
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      name: formData.name,
      description: formData.description,
      price: formData.price,
      image_url: imageUrl,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a product
export const deleteProduct = async (id: string, imageUrl: string | null): Promise<void> => {
  // Delete image from storage if it exists
  if (imageUrl) {
    const fileName = imageUrl.split('/').pop();
    if (fileName) {
      const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
      if (storageError) console.error('Error deleting image from storage:', storageError);
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
};