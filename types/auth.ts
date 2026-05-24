export type UserRole = 'customer' | 'store' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: UserProfile | null;
  error: string | null;
}
