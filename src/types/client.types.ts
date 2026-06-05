import type { CLIENT_STATUSES } from "@/constants/enums";

export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export interface Client {
  _id: string;
  company_name: string;
  contact_person_name: string;
  email?: string;
  phone_number?: string;
  website_link?: string;
  social_media_links?: Record<string, string>;
  sector?: string;
  address?: string;
  status: ClientStatus;
  assigned_manager_id?: string;
  assigned_manager?: { _id: string; name: string };
  notes?: string;
  source_lead_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClientPayload {
  company_name: string;
  contact_person_name: string;
  email?: string;
  phone_number?: string;
  website_link?: string;
  social_media_links?: Record<string, string>;
  sector?: string;
  address?: string;
  status?: ClientStatus;
  assigned_manager_id?: string;
  notes?: string;
  source_lead_id?: string;
}

export interface ClientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatus;
  assigned_manager_id?: string;
  sector?: string;
}
