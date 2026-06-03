export type Role = 'free' | 'paid' | 'admin';
export type DocumentType = 'pdf' | 'schema';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  role: Role;
  newsletter_opt_in: boolean;
  created_at: string;
}

export interface SubscriptionRow {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string | null;
  current_period_end: string | null;
}

export interface DocumentRow {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  type: DocumentType;
  storage_path: string;
  is_premium: boolean;
  category: string | null;
  tags: string[];
  created_at: string;
}
