export type OrderStatus = 'new' | 'preparing' | 'ready' | 'paid';

export type PaymentMethod = 'dinheiro' | 'pix' | 'credito' | 'debito';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: number;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
  paid?: boolean;
  paymentMethod?: PaymentMethod;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
}
