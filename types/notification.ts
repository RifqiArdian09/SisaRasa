export type NotificationType =
  | 'general'
  | 'order_status'
  | 'new_product'
  | 'favorite_store'
  | 'promo'
  | 'review';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}
