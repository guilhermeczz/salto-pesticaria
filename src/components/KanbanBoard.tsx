import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import type { Order, OrderStatus } from '@/lib/types';
import { ListTodo, ChefHat, CheckCircle2, CreditCard, ChevronRight, Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// 👇 Adicionamos cores específicas para cada etapa do Kanban
const columns: {
  status: OrderStatus;
  label: string;
  icon: React.ElementType;
  colorText: string;
  colorBorder: string;
  nextAction?: OrderStatus;
}[] = [
  { status: 'new', label: 'Novos', icon: ListTodo, colorText: 'text-blue-500', colorBorder: 'border-t-blue-500', nextAction: 'preparing' },
  { status: 'preparing', label: 'Preparando', icon: ChefHat, colorText: 'text-orange-500', colorBorder: 'border-t-orange-500', nextAction: 'ready' },
  { status: 'ready', label: 'Prontos', icon: CheckCircle2, colorText: 'text-green-500', colorBorder: 'border-t-green-500', nextAction: 'paid' },
  { status: 'paid', label: 'Pagos', icon: CreditCard, colorText: 'text-gray-500', colorBorder: 'border-t-gray-600' },
];

const removerAcentos = (str: string) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// 👇 Função movida para fora para ser usada tanto na impressão quanto no visual do Cartão
const processarNota = (notes: string) => {
  if (!notes) return { tipo: '', textoObs: '' };
  const regex = /\[(LOCAL|DELIVERY|RETIRADA)\]/i;
  const match = notes.match(regex);
  const tipo = match ? match[1].toUpperCase() : '';
  const textoObs = notes.replace(regex, '').trim();
  return { tipo, textoObs };
};

export function KanbanBoard({ onEditOrder }: { onEditOrder?: (order: Order) => void }) {
  const store = useAppStore();
  const todayOrders = store.getTodayOrders?.() ?? [];
  const deleteOrder = store.deleteOrder ?? (() => {});
  const { moveOrder, payOrder } = useAppStore();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (printOrder) {
      const timer = setTimeout(() => {
        window.print();
        setPrintOrder(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [printOrder]);

  const ordersByStatus = useMemo(() => {
    const grouped: Record<OrderStatus, Order[]> = {
      new: [], preparing: [], ready: [], paid: [],
    };
    todayOrders.forEach(o => {
      if (grouped[o.status]) grouped[o.status].push(o);
    });
    return grouped;
  }, [todayOrders]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {columns.map(col => {
          const colOrders = ordersByStatus[col.status] ?? [];
          return (
            <div 
              key={col.status} 
              // 👇 Bordas coloridas no topo de cada coluna e sombra sutil
              className={`bg-card border border-border border-t-4 ${col.colorBorder} rounded-2xl p-3 flex flex-col min-h-[70vh] shadow-sm ${col.status === 'paid' ? 'opacity-90' : ''}`}
            >
              <div className="mb-3 border-b border-border pb-2 flex justify-between items-center">
                <h3 className={`font-black uppercase flex gap-2 items-center tracking-wider text-sm ${col.colorText}`}>
                  <col.icon className="w-4 h-4" />
                  {col.label}
                </h3>
                <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">
                  {colOrders.length}
                </span>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {colOrders.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center mt-8 italic">Sem pedidos</p>
                )}
                {colOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    nextAction={col.nextAction}
                    onEdit={onEditOrder ? () => onEditOrder(order) : undefined}
                    onDelete={() => setDeleteTarget(order.id)}
                    onPrint={() => setPrintOrder(order)}
                    onPay={() => setPayTarget(order)}
                    moveOrder={moveOrder}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ÁREA DE IMPRESSÃO - INTACTA */}
      {printOrder && (
        <div className="hidden print:block bg-white text-black p-0 m-0 w-[58mm] font-mono">
          <div style={{ width: '54mm', padding: '2px', color: '#000', background: '#fff', fontSize: '12px' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>{removerAcentos("GARDENS LANCHES")}</div>
            <div style={{ textAlign: 'center', fontSize: '10px', marginBottom: '5px' }}>{removerAcentos("PRODUÇÃO COZINHA")}</div>
            <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>PEDIDO: #{printOrder.number ? printOrder.number.toString().padStart(4, '0') : '0000'}</div>
            <div>DATA: {format(new Date(printOrder.createdAt), 'HH:mm:ss')}</div>
            <div style={{ marginBottom: '4px' }}>CLIENTE: {removerAcentos(printOrder.customerName)}</div>
            <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }}></div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {printOrder.items.map((item, idx) => (
                  <tr key={idx} style={{ verticalAlign: 'top' }}>
                    <td style={{ padding: '3px 0', width: '35mm' }}><span style={{ fontWeight: 'bold' }}>{item.quantity}un</span> - {removerAcentos(item.productName)}</td>
                    <td style={{ textAlign: 'right', padding: '3px 0', whiteSpace: 'nowrap' }}>R${(item.quantity * item.unitPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }}></div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', textAlign: 'right', marginTop: '2px' }}>TOTAL: R$ {printOrder.total.toFixed(2)}</div>
            {printOrder.notes && (
              <div style={{ marginTop: '8px' }}>
                {processarNota(printOrder.notes).textoObs && (
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold' }}>OBS:</span><br />
                    <div style={{ background: '#eee', padding: '3px', border: '1px solid #000', fontSize: '11px' }}>{removerAcentos(processarNota(printOrder.notes).textoObs)}</div>
                  </div>
                )}
                {processarNota(printOrder.notes).tipo && (
                  <div style={{ textAlign: 'center', fontWeight: 'black', fontSize: '14px', border: '2px solid #000', padding: '4px', marginTop: '5px' }}>{processarNota(printOrder.notes).tipo}</div>
                )}
              </div>
            )}
            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '11px', marginTop: '15px' }}>(Gardens)</div>
            <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '10px' }}>.</div>
          </div>
        </div>
      )}

      {/* MODAIS INTACTOS */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] print:hidden">
          <div style={{ backgroundColor: '#111', color: '#fff' }} className="p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-center mb-6">Excluir Pedido?</h3>
            <div className="flex gap-3 justify-center">
              <button className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-all" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all" onClick={() => { deleteOrder(deleteTarget); setDeleteTarget(null); }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO ATUALIZADO */}
      {payTarget && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[999] print:hidden">
          <div style={{ backgroundColor: '#111', color: '#fff' }} className="p-8 rounded-3xl shadow-[0_0_50px_rgba(255,106,0,0.15)] max-w-sm w-full mx-4 border border-gray-800 animate-slide-up">
            
            <div className="flex flex-col items-center mb-6 border-b border-gray-800 pb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-black text-center mb-1">Cobrar Pedido</h3>
              <p className="text-muted-foreground text-sm">Selecione a forma de pagamento</p>
              <p className="text-3xl font-black text-white mt-4 tracking-tight">
                R$ {payTarget.total.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button 
                onClick={() => { payOrder(payTarget.id, 'dinheiro'); setPayTarget(null); }} 
                className="py-4 flex flex-col items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-500 rounded-2xl font-black transition-all group"
              >
                Dinheiro
              </button>
              
              <button 
                onClick={() => { payOrder(payTarget.id, 'pix'); setPayTarget(null); }} 
                className="py-4 flex flex-col items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-500 rounded-2xl font-black transition-all"
              >
                PIX
              </button>

              <button 
                onClick={() => { payOrder(payTarget.id, 'credito'); setPayTarget(null); }} 
                className="py-4 flex flex-col items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500 rounded-2xl font-black transition-all"
              >
                Crédito
              </button>

              <button 
                onClick={() => { payOrder(payTarget.id, 'debito'); setPayTarget(null); }} 
                className="py-4 flex flex-col items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-500 rounded-2xl font-black transition-all"
              >
                Débito
              </button>
            </div>

            <button 
              className="w-full py-4 text-gray-500 hover:bg-gray-800 hover:text-white rounded-xl font-bold transition-all" 
              onClick={() => setPayTarget(null)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function OrderCard({ order, nextAction, onEdit, onDelete, onPrint, onPay, moveOrder }: any) {
  const displayId = order.number ? order.number.toString().padStart(4, '0') : '0000';
  
  // Extrai as informações de tag para pintar no topo do cartão
  const { tipo, textoObs } = processarNota(order.notes);

  // Define a cor da badge dependendo do tipo
  const badgeColor = 
    tipo === 'DELIVERY' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 
    tipo === 'LOCAL' ? 'bg-green-500/20 text-green-500 border-green-500/30' : 
    'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';

  return (
    // 👇 Efeito Hover Tátil (Levanta o cartão e aumenta a sombra)
    <div className="bg-background border border-border rounded-xl p-3 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative group">
      
      {/* 👇 Etiqueta Visual de Delivery/Local (Se existir) */}
      {tipo && (
        <div className="mb-2">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${badgeColor}`}>
            {tipo}
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div>
          <span className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">#{displayId}</span>
          <p className="font-bold mt-1.5 text-sm">{order.customerName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-muted-foreground font-medium">{format(new Date(order.createdAt), 'HH:mm', { locale: ptBR })}</span>
          <button
            onClick={onPrint}
            // Botão imprimir aparece com mais força ao passar o mouse no cartão
            className="flex items-center gap-1.5 text-xs font-black bg-orange-500 text-white px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-600 transition-all active:scale-95 opacity-90 group-hover:opacity-100"
          >
            <Printer className="w-3.5 h-3.5" />
            IMPRIMIR
          </button>
        </div>
      </div>

      <div className="space-y-1 mb-3 border-t border-border/50 pt-2">
        {order.items.map((item: any, idx: number) => (
          <div key={idx} className="text-sm flex justify-between">
            <span className="text-muted-foreground">
              <span className="font-bold text-primary mr-1">{item.quantity}x</span> {item.productName}
            </span>
          </div>
        ))}
      </div>

      {/* Renderiza apenas a observação limpa, sem a tag */}
      {textoObs && (
        <div className="text-xs bg-muted/50 p-2 rounded-md mb-3 text-muted-foreground italic border-l-2 border-muted-foreground/30">
          {textoObs}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
        <span className="font-bold text-sm">R$ {order.total.toFixed(2)}</span>
        <div className="flex gap-2">
          {order.status !== 'paid' && (
            <button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-white hover:bg-destructive rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
          )}
          
          {onEdit && order.status === 'new' && (
            <button onClick={onEdit} className="text-xs font-bold px-3 py-1 bg-muted hover:bg-primary hover:text-black rounded-md transition-colors">Editar</button>
          )}

          {nextAction && (
            <button 
              onClick={() => {
                if (nextAction === 'paid') {
                  onPay();
                } else {
                  moveOrder(order.id, nextAction);
                }
              }} 
              className="p-1.5 bg-primary text-black rounded-md hover:scale-105 transition-transform"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}