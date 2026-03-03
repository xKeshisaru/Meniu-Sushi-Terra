export interface Product {
  id?: string;
  name: string;
  desc: string;
  price: string;
  weight: string;
  image: string;
  active?: boolean;
  featured?: boolean;
  likes?: number;
  nutrition?: string;
  isHeader?: boolean;
  isSubHeader?: boolean;
  index?: number;
}

export interface Category {
  id: string;
  title: string;
  icon: string;
  image: string;
  items: Product[];
  index?: number;
}

export interface Pairing {
  wine: string;
  garnish: string;
  desc: string;
}

export type PairingLogic = Record<string, Pairing>;
