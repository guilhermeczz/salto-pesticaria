import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Order, Product, User, OrderStatus, OrderItem, Category, PaymentMethod } from './types';
import { supabase } from './supabase';
import { toast } from 'sonner';

interface AppState {
  orders: Order[];
  products: Product[];
  users: User[];
  categories: Category[];
  orderCounter: number;
  fetchUsers: () => Promise<void>; // ✨ Nova função para atualização instantânea
  addOrder: (customerName: string, items: OrderItem[], notes?: string) => Promise<void>;
  updateOrder: (orderId: string, customerName: string, items: OrderItem[], notes?: string) => Promise<void>;
  moveOrder: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  payOrder: (orderId: string, paymentMethod: PaymentMethod) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<boolean>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getTodayOrders: () => Order[];
  getArchivedOrders: (startDate: Date, endDate: Date) => Order[];
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // ✨ Função isolada para buscar usuários (usada pela UsersPage)
  const fetchUsers = useCallback(async () => {
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('id, nome, username')
      .order('nome');
    
    if (error) {
      console.error("Erro ao buscar usuários:", error);
    } else if (userData) {
      setUsers(userData.map((u: any) => ({ 
        id: u.id, 
        name: u.nome, 
        username: u.username,
        password: '' // Senha não vem mais daqui!
      })));
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Categorias
      const { data: catData } = await supabase.from('categorias').select('*');
      if (catData) setCategories(catData.map((c: any) => ({ id: c.id, name: c.nome, emoji: c.emoji })));

      // Produtos
      const { data: prodData } = await supabase.from('produtos').select('*');
      if (prodData) setProducts(prodData.map((p: any) => ({ 
        id: p.id, name: p.nome, price: Number(p.preco), categoryId: p.categoria_id 
      })));

      // Chamamos a nossa nova função de usuários
      await fetchUsers();

      // Pedidos
      const { data: orderData } = await supabase.from('pedidos').select('*, pedido_itens(*)').order('created_at', { ascending: false });
      if (orderData) {
        setOrders(orderData.map((o: any) => ({
          id: o.id.toString(),
          number: o.id,
          customerName: o.cliente_nome,
          total: Number(o.valor_total),
          status: o.status as OrderStatus,
          paid: o.pago,
          paymentMethod: o.forma_pagamento as PaymentMethod,
          notes: o.observacao,
          createdAt: new Date(o.created_at),
          items: (o.pedido_itens || []).map((item: any) => ({
            productId: item.id.toString(),
            productName: item.produto_nome,
            quantity: item.quantidade,
            unitPrice: Number(item.preco_unitario)
          }))
        })));
      }
    } catch (error) { console.error("Erro ao buscar dados:", error); }
  }, [fetchUsers]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- MÉTODOS DE PEDIDOS ---
  const addOrder = useCallback(async (customerName: string, items: OrderItem[], notes: string = '') => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const { data: order, error } = await supabase.from('pedidos').insert([{ 
      cliente_nome: customerName, valor_total: total, status: 'new', observacao: notes
    }]).select().single();
    if (error) throw error;
    
    const itemsToInsert = items.map(item => ({
      pedido_id: order.id, produto_nome: item.productName, quantidade: item.quantity, preco_unitario: item.unitPrice
    }));
    await supabase.from('pedido_itens').insert(itemsToInsert);
    fetchData();
    toast.success("Pedido realizado!");
  }, [fetchData]);

  const updateOrder = useCallback(async (orderId: string, customerName: string, items: OrderItem[], notes: string = '') => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const { error: orderError } = await supabase.from('pedidos').update({ 
      cliente_nome: customerName, valor_total: total, observacao: notes 
    }).eq('id', orderId);
    if (orderError) throw orderError;
    await supabase.from('pedido_itens').delete().eq('pedido_id', orderId);
    
    const itemsToInsert = items.map(item => ({
      pedido_id: orderId, produto_nome: item.productName, quantidade: item.quantity, preco_unitario: item.unitPrice
    }));
    await supabase.from('pedido_itens').insert(itemsToInsert);
    fetchData();
    toast.success("Pedido atualizado!");
  }, [fetchData]);

  const moveOrder = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    await supabase.from('pedidos').update({ status: newStatus }).eq('id', orderId);
    fetchData();
  }, [fetchData]);

  const deleteOrder = useCallback(async (orderId: string) => {
    await supabase.from('pedidos').delete().eq('id', orderId);
    fetchData();
  }, [fetchData]);

  const payOrder = useCallback(async (orderId: string, paymentMethod: PaymentMethod) => {
    await supabase.from('pedidos').update({ status: 'paid', pago: true, forma_pagamento: paymentMethod }).eq('id', orderId);
    fetchData();
  }, [fetchData]);

  // --- MÉTODOS DE PRODUTOS ---
  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('produtos').insert([{
      nome: product.name, preco: product.price, categoria_id: product.categoryId
    }]);
    if (error) return false;
    fetchData();
    return true;
  }, [fetchData]);

  const updateProduct = useCallback(async (product: Product) => {
    await supabase.from('produtos').update({ 
      nome: product.name, preco: product.price, categoria_id: product.categoryId 
    }).eq('id', product.id);
    fetchData();
    toast.success("Produto atualizado!");
  }, [fetchData]);

  const deleteProduct = useCallback(async (id: string) => {
    await supabase.from('produtos').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  // --- MÉTODOS DE CATEGORIAS ---
  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    await supabase.from('categorias').insert([{ nome: category.name, emoji: category.emoji }]);
    fetchData();
  }, [fetchData]);

  const updateCategory = useCallback(async (category: Category) => {
    await supabase.from('categorias').update({ 
      nome: category.name, emoji: category.emoji 
    }).eq('id', category.id);
    fetchData();
    toast.success("Categoria atualizada!");
  }, [fetchData]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('categorias').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  // --- MÉTODOS DE USUÁRIOS (Sincronizados com o Auth) ---
  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    // ⚠️ Atenção: Para criar login, use o register do useAuth().
    // Esta função aqui agora serve apenas para casos de contingência.
    const { error } = await supabase.from('usuarios').insert([{ 
      nome: user.name, 
      username: user.username 
    }]);
    if (error) return false;
    fetchUsers();
    return true;
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    // Primeiro deleta da tabela pública
    await supabase.from('usuarios').delete().eq('id', id);
    fetchUsers();
    // Nota: O usuário continuará no Auth do Supabase até ser removido lá manualmente por segurança.
  }, [fetchUsers]);

  const getTodayOrders = () => orders.filter((o: any) => {
    const orderDate = new Date(o.createdAt).toDateString();
    const today = new Date().toDateString();
    const isToday = orderDate === today;
    const isNotFinished = o.status !== 'paid';
    return isToday || isNotFinished;
  });

  const getArchivedOrders = (startDate: Date, endDate: Date) => orders.filter((o: any) => {
    const date = new Date(o.createdAt);
    return date >= startDate && date <= endDate;
  });

  return (
    <AppContext.Provider
      value={{
        orders, products, users, categories, orderCounter: orders.length + 1,
        fetchUsers, // ✨ Exposto para a UsersPage
        addOrder, updateOrder, moveOrder, deleteOrder, payOrder,
        addProduct, updateProduct, deleteProduct, addCategory, updateCategory, deleteCategory, addUser, deleteUser,
        getTodayOrders, getArchivedOrders
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