import { request } from "./client";
import type { Movie, Hall, Screening, Seat, Ticket, RichScreening } from "./types";

const DB_BASE = "http://localhost:8000/api";

const dbRequest = <T>(path: string, options: RequestInit = {}) => 
  request<T>(DB_BASE, path, options);

export const dbApi = {
  movies: {
    list: () => dbRequest<Movie[]>("/movies/"),
    get: (id: number) => dbRequest<Movie>(`/movies/${id}/`),
    create: (data: Partial<Movie>) => dbRequest<Movie>("/movies/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Movie>) => dbRequest<Movie>(`/movies/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    delete: (id: number) => dbRequest<void>(`/movies/${id}/`, {
      method: "DELETE",
    }),
  },

  halls: {
    list: () => dbRequest<Hall[]>("/halls/"),
    get: (id: number) => dbRequest<Hall>(`/halls/${id}/`),
    create: (data: Partial<Hall>) => dbRequest<Hall>("/halls/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Hall>) => dbRequest<Hall>(`/halls/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    delete: (id: number) => dbRequest<void>(`/halls/${id}/`, {
      method: "DELETE",
    }),
  },

  screenings: {
    list: (movieId?: number) => {
      const path = movieId ? `/screenings/?movie=${movieId}` : "/screenings/";
      return dbRequest<Screening[]>(path);
    },
    showingToday: () => dbRequest<Screening[]>("/screenings/showing_today"),
    get: (id: number) => dbRequest<Screening>(`/screenings/${id}/`),
    create: (data: Partial<Screening>) => dbRequest<Screening>("/screenings/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Screening>) => dbRequest<Screening>(`/screenings/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    delete: (id: number) => dbRequest<void>(`/screenings/${id}/`, {
      method: "DELETE",
    }),
  },

  seats: {
    listByHall: (hallId: number) => dbRequest<Seat[]>(`/seats/?hall=${hallId}`),
    get: (id: number) => dbRequest<Seat>(`/seats/${id}/`),
    create: (data: Partial<Seat>) => dbRequest<Seat>("/seats/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Seat>) => dbRequest<Seat>(`/seats/${id}/`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    delete: (id: number) => dbRequest<void>(`/seats/${id}/`, {
      method: "DELETE",
    }),
  },

  tickets: {
    list: () => dbRequest<Ticket[]>("/tickets/"),
    myTickets: () => dbRequest<import("./types").RichTicket[]>("/tickets/my_tickets/"),
    listByScreening: (screeningId: number) => dbRequest<Ticket[]>(`/tickets/?screening=${screeningId}`),
    get: (id: number) => dbRequest<Ticket>(`/tickets/${id}/`),
    create: (data: Partial<Ticket>) => dbRequest<Ticket>("/tickets/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Ticket>) => dbRequest<Ticket>(`/tickets/${id}/`, {
      method: "PATCH", // Use PATCH for staff to update status
      body: JSON.stringify(data),
    }),
    reissue: (id: number) => dbRequest<void>(`/tickets/${id}/re_issue/`, {
      method: "PATCH",
    }),
    delete: (id: number) => dbRequest<void>(`/tickets/${id}/`, {
      method: "DELETE",
    }),
  },
};
