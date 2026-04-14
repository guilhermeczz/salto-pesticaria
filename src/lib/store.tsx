import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Order, Product, User, OrderStatus, OrderItem } from './types';

interface AppState {
  orders: Order[];
  products: Product[];
  users: User[];
  orderCounter: number;
  addOrder: (customerName: string, items: OrderItem[]) => void;
  moveOrder: (orderId: string, newStatus: OrderStatus) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  getTodayOrders: () => Order[];
  getArchivedOrders: (startDate: Date, endDate: Date) => Order[];
}

const AppContext = createContext<AppState | null>(null);

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const sampleProducts: Product[] = [
  { id: '1', name: 'X-Bacon', price: 18.00, category: 'lanches' },
  { id: '2', name: 'X-Tudo', price: 22.00, category: 'lanches' },
  { id: '3', name: 'Gardens Especial', price: 25.00, category: 'lanches' },
  { id: '4', name: 'Batata Frita', price: 15.00, category: 'porcoes' },
  { id: '5', name: 'Onion Rings', price: 18.00, category: 'porcoes' },
  { id: '6', name: 'Refrigerante', price: 6.00, category: 'bebidas' },
  { id: '7', name: 'Coca-Cola', price: 7.00, category: 'bebidas' },
  { id: '8', name: 'Suco Natural', price: 10.00, category: 'bebidas' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Admin', username: 'admin', password: '1234' },
  ]);
  const [orderCounter, setOrderCounter] = useState(1);

  const addOrder = useCallback((customerName: string, items: OrderItem[]) => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const newOrder: Order = {
      id: crypto.randomUUID(),
      number: orderCounter,
      customerName,
      items,
      total,
      status: 'new',
      createdAt: new Date(),
    };
    setOrders(prev => [newOrder, ...prev]);
    setOrderCounter(prev => prev + 1);
  }, [orderCounter]);

  const moveOrder = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }, []);

  const addProduct = useCallback((product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: crypto.randomUUID() }]);
  }, []);

  const updateProduct = useCallback((product: Product) => {
    setProducts(prev => prev.map(p => (p.id === product.id ? product : p)));
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    setUsers(prev => [...prev, { ...user, id: crypto.randomUUID() }]);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const getTodayOrders = useCallback(() => {
    return orders.filter(o => isToday(o.createdAt));
  }, [orders]);

  const getArchivedOrders = useCallback((startDate: Date, endDate: Date) => {
    return orders.filter(o => {
      const d = o.createdAt;
      return d >= startDate && d <= endDate;
    });
  }, [orders]);

  return (
    <AppContext.Provider
      value={{
        orders, products, users, orderCounter,
        addOrder, moveOrder,
        addProduct, updateProduct, deleteProduct,
        addUser, deleteUser,
        getTodayOrders, getArchivedOrders,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used within AppProvider');
  return ctx;
}
