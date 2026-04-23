import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Order, Product, User, OrderStatus, OrderItem, Category, PaymentMethod, OrderBatch } from './types';
import { supabase } from './supabase';
import { toast } from 'sonner';

interface AppState {
  orders: Order[];
  products: Product[];
  users: User[];
  categories: Category[];
  orderCounter: number;
  fetchUsers: () => Promise<void>;
  addOrder: (customerName: string, items: OrderItem[], notes?: string) => Promise<void>;
  updateOrder: (orderId: string, customerName: string, items: OrderItem[], notes?: string) => Promise<void>;
  addItemsToOrder: (orderId: string, customerName: string, items: OrderItem[], batchNotes?: string) => Promise<void>;
  moveOrder: (orderId: string, newStatus: OrderStatus) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  payOrder: (
    orderId: string,
    paymentMethod: PaymentMethod,
    extra?: { amountReceived?: number | null; changeGiven?: number | null }
  ) => Promise<void>;
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

const makeBatchId = () => `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchUsers = useCallback(async () => {
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('id, nome, username')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return;
    }

    if (userData) {
      setUsers(
        userData.map((u: any) => ({
          id: u.id,
          name: u.nome,
          username: u.username,
        }))
      );
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: catData } = await supabase.from('categorias').select('*');
      if (catData) {
        setCategories(catData.map((c: any) => ({
          id: c.id,
          name: c.nome,
          emoji: c.emoji,
        })));
      }

      const { data: prodData } = await supabase.from('produtos').select('*');
      if (prodData) {
        setProducts(prodData.map((p: any) => ({
          id: p.id,
          name: p.nome,
          price: Number(p.preco),
          categoryId: p.categoria_id,
          active: p.ativo,
        })));
      }

      await fetchUsers();

      const { data: orderData, error: orderError } = await supabase
        .from('pedidos')
        .select('*, pedido_itens(*)')
        .order('created_at', { ascending: false });

      if (orderError) {
        console.error('Erro ao buscar pedidos:', orderError);
        return;
      }

      if (orderData) {
        const mappedOrders: Order[] = orderData.map((o: any) => {
          const mappedItems: OrderItem[] = (o.pedido_itens || [])
            .map((item: any) => ({
              productId: String(item.id),
              productName: item.produto_nome,
              quantity: item.quantidade,
              unitPrice: Number(item.preco_unitario),
              batchId: item.lote_id || `legacy_${o.id}`,
              batchNotes: item.lote_observacao || '',
              createdAt: item.created_at ? new Date(item.created_at) : new Date(o.created_at),
            }))
            .sort(
              (a: OrderItem, b: OrderItem) =>
                new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
            );

          const groupedByBatch = mappedItems.reduce<Record<string, OrderItem[]>>((acc, item) => {
            const key = item.batchId || `legacy_${o.id}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
          }, {});

          let itemBatches: OrderBatch[] = Object.entries(groupedByBatch)
            .map(([batchId, items]) => {
              const sortedItems = [...items].sort(
                (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
              );

              return {
                id: batchId,
                items: sortedItems,
                notes: sortedItems[0]?.batchNotes || '',
                createdAt: sortedItems[0]?.createdAt || new Date(o.created_at),
                isAdditional: false,
              };
            })
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          itemBatches = itemBatches.map((batch, index) => ({
            ...batch,
            isAdditional: index > 0,
            notes: batch.notes || (index === 0 ? o.observacao || '' : ''),
          }));

          return {
            id: String(o.id),
            number: o.id,
            customerName: o.cliente_nome,
            total: Number(o.valor_total),
            status: o.status as OrderStatus,
            paid: o.pago,
            paymentMethod: o.forma_pagamento as PaymentMethod,
            notes: o.observacao,
            createdAt: new Date(o.created_at),
            items: mappedItems,
            itemBatches,
            paidAt: o.paid_at ? new Date(o.paid_at) : undefined,
            cashSessionId: o.cash_session_id ?? null,
            amountReceived: o.amount_received != null ? Number(o.amount_received) : null,
            changeGiven: o.change_given != null ? Number(o.change_given) : null,
            createdBy: o.created_by ?? null,
          };
        });

        setOrders(mappedOrders);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

useEffect(() => {
  let isMounted = true;

  const setupRealtime = async () => {
    const existingChannels = supabase.getChannels();
    for (const channel of existingChannels) {
      if (
        channel.topic === 'realtime:pedidos-sync' ||
        channel.topic.includes('pedidos-sync')
      ) {
        await supabase.removeChannel(channel);
      }
    }

    const channel = supabase
      .channel(`pedidos-sync-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        async () => {
          if (isMounted) await fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedido_itens' },
        async () => {
          if (isMounted) await fetchData();
        }
      )
      .subscribe((status) => {
        console.log('Realtime pedidos:', status);
      });

    return channel;
  };

  let activeChannel: any = null;

  setupRealtime().then((channel) => {
    activeChannel = channel;
  });

  return () => {
    isMounted = false;
    if (activeChannel) {
      supabase.removeChannel(activeChannel);
    }
  };
}, [fetchData]);

  const addOrder = useCallback(async (customerName: string, items: OrderItem[], notes: string = '') => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const createdBy =
      user?.user_metadata?.full_name ||
      user?.user_metadata?.username ||
      user?.email?.split('@')[0] ||
      'Operador';

    const { data: order, error } = await supabase
      .from('pedidos')
      .insert([{
        cliente_nome: customerName,
        valor_total: total,
        status: 'new',
        observacao: notes,
        created_by: createdBy,
      }])
      .select()
      .single();

    if (error) throw error;

    const batchId = makeBatchId();
    const now = new Date().toISOString();

    const itemsToInsert = items.map(item => ({
      pedido_id: order.id,
      produto_nome: item.productName,
      quantidade: item.quantity,
      preco_unitario: item.unitPrice,
      lote_id: batchId,
      lote_observacao: notes,
      created_at: now,
    }));

    const { error: itemsError } = await supabase.from('pedido_itens').insert(itemsToInsert);
    if (itemsError) throw itemsError;

    await fetchData();
    toast.success('Pedido realizado!');
  }, [fetchData]);

  const updateOrder = useCallback(async (orderId: string, customerName: string, items: OrderItem[], notes: string = '') => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const { error: orderError } = await supabase
      .from('pedidos')
      .update({
        cliente_nome: customerName,
        valor_total: total,
        observacao: notes,
      })
      .eq('id', orderId);

    if (orderError) throw orderError;

    const { error: deleteItemsError } = await supabase.from('pedido_itens').delete().eq('pedido_id', orderId);
    if (deleteItemsError) throw deleteItemsError;

    const batchId = makeBatchId();
    const now = new Date().toISOString();

    const itemsToInsert = items.map(item => ({
      pedido_id: orderId,
      produto_nome: item.productName,
      quantidade: item.quantity,
      preco_unitario: item.unitPrice,
      lote_id: batchId,
      lote_observacao: notes,
      created_at: now,
    }));

    const { error: insertItemsError } = await supabase.from('pedido_itens').insert(itemsToInsert);
    if (insertItemsError) throw insertItemsError;

    await fetchData();
    toast.success('Pedido atualizado!');
  }, [fetchData]);

  const addItemsToOrder = useCallback(async (orderId: string, customerName: string, items: OrderItem[], batchNotes: string = '') => {
    const batchTotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const batchId = makeBatchId();
    const now = new Date().toISOString();

    const { data: currentOrder, error: currentOrderError } = await supabase
      .from('pedidos')
      .select('valor_total')
      .eq('id', orderId)
      .single();

    if (currentOrderError) throw currentOrderError;

    const itemsToInsert = items.map(item => ({
      pedido_id: orderId,
      produto_nome: item.productName,
      quantidade: item.quantity,
      preco_unitario: item.unitPrice,
      lote_id: batchId,
      lote_observacao: batchNotes,
      created_at: now,
    }));

    const { error: insertError } = await supabase.from('pedido_itens').insert(itemsToInsert);
    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        cliente_nome: customerName,
        valor_total: Number(currentOrder.valor_total || 0) + batchTotal,
      })
      .eq('id', orderId);

    if (updateError) throw updateError;

    await fetchData();
    toast.success('Itens adicionados ao pedido!');
  }, [fetchData]);

  const moveOrder = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    await supabase.from('pedidos').update({ status: newStatus }).eq('id', orderId);
    fetchData();
  }, [fetchData]);

  const deleteOrder = useCallback(async (orderId: string) => {
    await supabase.from('pedidos').delete().eq('id', orderId);
    fetchData();
  }, [fetchData]);

  const payOrder = useCallback(
    async (
      orderId: string,
      paymentMethod: PaymentMethod,
      extra?: { amountReceived?: number | null; changeGiven?: number | null }
    ) => {
      const { data: openSession, error: sessionError } = await supabase
        .from('cash_sessions')
        .select('id')
        .eq('status', 'open')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error('Erro ao buscar caixa aberto:', sessionError);
        toast.error('Erro ao validar o caixa aberto.');
        return;
      }

      if (!openSession) {
        toast.error('Abra o caixa antes de registrar pagamentos.');
        return;
      }

      const payload: any = {
        status: 'paid',
        pago: true,
        forma_pagamento: paymentMethod,
        paid_at: new Date().toISOString(),
        cash_session_id: openSession.id,
      };

      if (paymentMethod === 'dinheiro') {
        payload.amount_received =
          extra?.amountReceived != null ? Number(extra.amountReceived) : null;
        payload.change_given =
          extra?.changeGiven != null ? Number(extra.changeGiven) : null;
      } else {
        payload.amount_received = null;
        payload.change_given = null;
      }

      const { error } = await supabase.from('pedidos').update(payload).eq('id', orderId);

      if (error) {
        console.error('Erro ao registrar pagamento:', error);
        toast.error('Erro ao registrar pagamento.');
        return;
      }

      fetchData();
    },
    [fetchData]
  );

  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    const { error } = await supabase.from('produtos').insert([{
      nome: product.name,
      preco: product.price,
      categoria_id: product.categoryId,
    }]);

    if (error) return false;
    fetchData();
    return true;
  }, [fetchData]);

  const updateProduct = useCallback(async (product: Product) => {
    await supabase
      .from('produtos')
      .update({
        nome: product.name,
        preco: product.price,
        categoria_id: product.categoryId,
      })
      .eq('id', product.id);

    fetchData();
    toast.success('Produto atualizado!');
  }, [fetchData]);

  const deleteProduct = useCallback(async (id: string) => {
    await supabase.from('produtos').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    await supabase.from('categorias').insert([{ nome: category.name, emoji: category.emoji }]);
    fetchData();
  }, [fetchData]);

  const updateCategory = useCallback(async (category: Category) => {
    await supabase
      .from('categorias')
      .update({
        nome: category.name,
        emoji: category.emoji,
      })
      .eq('id', category.id);

    fetchData();
    toast.success('Categoria atualizada!');
  }, [fetchData]);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('categorias').delete().eq('id', id);
    fetchData();
  }, [fetchData]);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    const { error } = await supabase.from('usuarios').insert([{
      nome: user.name,
      username: user.username,
    }]);

    if (error) return false;
    fetchUsers();
    return true;
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    const targetUser = users.find((u) => u.id === id);

    const isProtected =
      targetUser &&
      (
        String(targetUser.name || '').trim().toLowerCase() === 'desenvolvedor' ||
        String(targetUser.username || '').trim().toLowerCase() === 'dev'
      );

    if (isProtected) {
      toast.error('O acesso do Desenvolvedor é protegido e não pode ser removido.');
      return;
    }

    await supabase.from('usuarios').delete().eq('id', id);
    fetchUsers();
  }, [fetchUsers, users]);

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
        orders,
        products,
        users,
        categories,
        orderCounter: orders.length + 1,
        fetchUsers,
        addOrder,
        updateOrder,
        addItemsToOrder,
        moveOrder,
        deleteOrder,
        payOrder,
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        updateCategory,
        deleteCategory,
        addUser,
        deleteUser,
        getTodayOrders,
        getArchivedOrders,
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