
export type AvailabilityRule = {
  id: string;
  dow: number; // 0=Sun..6=Sat
  start_time: string; // "08:00:00" etc
  end_time: string;
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null;
  active: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  service_id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  vehicle: string | null;
  notes: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
};


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
