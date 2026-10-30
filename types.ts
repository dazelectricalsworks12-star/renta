
export enum PropertyType {
  HOUSE = 'HOUSE',
  LAND = 'LAND'
}

export enum TransactionType {
  RENT = 'RENT',
  SALE = 'SALE'
}

export interface Property {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone: string;
  title: string;
  description: string;
  location: string;
  price: number;
  area: number;
  type: PropertyType;
  transaction: TransactionType;
  images: string[];
  createdAt: number;
  // New room counts
  beds: number;
  rooms: number;
  kitchens: number;
  parlors: number;
  toilets: number;
  // Security
  reportCount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  hasPaid: boolean;
  properties: string[]; // IDs
}

export type AppView = 'LANDING' | 'SEARCH' | 'OWNER_DASHBOARD' | 'OWNER_REGISTER' | 'LOGIN' | 'PAYMENT' | 'PROPERTY_DETAIL' | 'ADD_FIRST_PROPERTY' | 'CREATOR_DASHBOARD';
