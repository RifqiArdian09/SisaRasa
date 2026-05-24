export interface Product {
  id: string;
  store_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  original_price: number;
  discount_price: number;
  stock: number;
  expired_at: string;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  store?: {
    id: string;
    store_name: string;
    latitude: number | null;
    longitude: number | null;
    logo_url: string | null;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  product_images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
