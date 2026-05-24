export interface Store {
  id: string;
  user_id: string;
  store_name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  banner_url: string | null;
  logo_url: string | null;
  is_verified: boolean;
  verification_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  open_time: string | null;
  close_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoreWithProducts extends Store {
  products?: import('./product').Product[];
  _count?: {
    products: number;
    orders: number;
    favorites: number;
  };
}
