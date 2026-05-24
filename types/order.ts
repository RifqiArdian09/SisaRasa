export type OrderStatus = 'pending' | 'diproses' | 'siap_diambil' | 'selesai' | 'dibatalkan';

export interface Order {
  id: string;
  customer_id: string;
  store_id: string;
  total_price: number;
  payment_method: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer?: {
    id: string;
    name: string;
    phone: string | null;
  };
  store?: {
    id: string;
    store_name: string;
  };
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
  // Joined fields
  product?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
}
