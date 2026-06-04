export type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  password?: string;
  is_staff: boolean;
  is_admin: boolean;
};

export type AuthError = {
  message: string;
  code: string;
  param?: string;
};

export type AuthResponse = {
  status: number;
  data?: {
    user?: User;
    methods?: string[];
  };
  errors?: AuthError[];
};

export type LoginCredentials = {
  email?: string;
  password?: string;
};

export type SignupData = {
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  password?: string;
};

export type Movie = {
  id: number;
  title: string;
  description: string;
  producer: string;
  release_date: string;
  duration: string;
  rating: string;
  poster_url?: string;
  genres: string;
  is_active: boolean;
};

export type Hall = {
  id: number;
  name: string;
  rows_count: number;
  cols_count: number;
  dolby_atmos: boolean;
};

export type Screening = {
  id: number;
  movie: Movie;
  tickets_count?: number;
  hall: Hall;
  start_time: string;
  base_price: string;
};

export type SeatType = 'REGULAR' | 'VIP';

export type Seat = {
  id: number;
  hall: number;
  row_label: string;
  seat_number: number;
  grid_x: number;
  grid_y: number;
  seat_type: SeatType;
};

export type Ticket = {
  id: number;
  client: number;
  screening: number;
  seat: number;
  price_paid?: string;
  created_at: string;
  is_used: boolean;
  purchase: number;
};

export type PurchaseStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export type Purchase = {
  id: number;
  client: number;
  status: PurchaseStatus;
  created_at: string;
  paid_at?: string;
  cancelled_at?: string;
  total_price: string;
  tickets: Ticket[];
};

export type RichScreening = Omit<Screening, 'movie' | 'hall'> & {
  movie: Movie;
  hall: Hall;
};

export type RichTicket = Omit<Ticket, 'seat' | 'screening'> & {
  seat: Seat;
  screening: RichScreening;
};
