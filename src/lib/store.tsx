import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Order, Product, User, OrderStatus, OrderItem, Category, PaymentMethod } from './types';

interface AppState {
  orders: Order[];
  products: Product[];
  users: User[];
  categories: Category[];
  orderCounter: number;
  addOrder: (customerName: string, items: OrderItem[]) => void;
  updateOrder: (orderId: string, customerName: string, items: OrderItem[]) => void;
  moveOrder: (orderId: string, newStatus: OrderStatus) => void;
  deleteOrder: (orderId: string) => void;
  payOrder: (orderId: string, paymentMethod: PaymentMethod) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  deleteUser: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
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

const defaultCategories: Category[] = [
  { id: 'cat-1', name: 'Lanches', emoji: '🍔' },
  { id: 'cat-2', name: 'Porções', emoji: '🍟' },
  { id: 'cat-3', name: 'Bebidas', emoji: '🥤' },
];

const sampleProducts: Product[] = [
  { id: '1', name: 'X-Bacon', price: 18.00, categoryId: 'cat-1' },
  { id: '2', name: 'X-Tudo', price: 22.00, categoryId: 'cat-1' },
  { id: '3', name: 'Gardens Especial', price: 25.00, categoryId: 'cat-1' },
  { id: '4', name: 'Batata Frita', price: 15.00, categoryId: 'cat-2' },
  { id: '5', name: 'Onion Rings', price: 18.00, categoryId: 'cat-2' },
  { id: '6', name: 'Refrigerante', price: 6.00, categoryId: 'cat-3' },
  { id: '7', name: 'Coca-Cola', price: 7.00, categoryId: 'cat-3' },
  { id: '8', name: 'Suco Natural', price: 10.00, categoryId: 'cat-3' },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Admin', username: 'admin', password: '1234' },
  ]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
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

  const updateOrder = useCallback((orderId: string, customerName: string, items: OrderItem[]) => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, customerName, items, total } : o)
    );
  }, []);

  const moveOrder = useCallback((orderId: string, newStatus: OrderStatus) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  }, []);

  const payOrder = useCallback((orderId: string, paymentMethod: PaymentMethod) => {
    setOrders(prev =>
      prev.map(o => o.id === orderId ? { ...o, status: 'paid' as OrderStatus, paid: true, paymentMethod } : o)
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

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: crypto.randomUUID() }]);
  }, []);

  const updateCategory = useCallback((category: Category) => {
    setCategories(prev => prev.map(c => c.id === category.id ? category : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
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
        orders, products, users, categories, orderCounter,
        addOrder, updateOrder, moveOrder, deleteOrder, payOrder,
        addProduct, updateProduct, deleteProduct,
        addUser, deleteUser,
        addCategory, updateCategory, deleteCategory,
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
