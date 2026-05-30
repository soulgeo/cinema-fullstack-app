export type User = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  password?: string;
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
  movie: number;
  movie_title?: string;
  hall: Hall;
  hall_name?: string;
  start_time: string;
  base_price: string;
};

export enum SeatType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
}

export type Seat = {
  id: number;
  hall: number;
  row_label: string;
  seat_number: number;
  grid_x: number;
  grid_y: number;
  seat_type: SeatType;
};

export enum TicketStatus {
  RESERVED = 'RESERVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export type Ticket = {
  id: number;
  client: number;
  screening: number;
  seat: number;
  status: TicketStatus;
  price_paid?: string;
  created_at: string;
};
