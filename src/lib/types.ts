export type OrderStatus = 'new' | 'preparing' | 'ready' | 'paid';

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
}

export type ProductCategory = 'lanches' | 'porcoes' | 'bebidas';

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
}
