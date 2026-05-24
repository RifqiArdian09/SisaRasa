export interface Review {
  id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  image_url: string | null;
  created_at: string;
  // Joined fields
  customer?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  product?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  review_reply?: ReviewReply | null;
}

export interface ReviewReply {
  id: string;
  review_id: string;
  store_id: string;
  reply: string;
  created_at: string;
}
