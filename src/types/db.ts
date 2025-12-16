export type Service = {
  id: string;
  title: string;
  description: string | null;
  duration_mins: number;
  price_cents: number;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type Slot = {
  id: string;
  start_at: string;
  end_at: string;
  is_available: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  slot_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  vehicle: string | null;
  address: string | null;
  notes: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
};
