import { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { ArrowLeft, CalendarDays, TrendingUp, Receipt, LineChart, Store } from 'lucide-react';
import { Link } from '@tanstack/react-router';

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR');
}

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export function ReportsPage() {
  const { getArchivedOrders } = useAppStore();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputDate(d);
  });
  const [endDate, setEndDate] = useState(() => toInputDate(new Date()));

  // Pega os pedidos do período
  const orders = useMemo(() => {
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59');
    return getArchivedOrders(start, end);
  }, [startDate, endDate, getArchivedOrders]);

  // Cálculos de KPI
  const paidOrders = useMemo(() => orders.filter(o => o.status === 'paid'), [orders]);
  
  const totalRevenue = useMemo(() => {
    return paidOrders.reduce((sum, o) => sum + o.total, 0);
  }, [paidOrders]);

  const ticketMedio = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  // Gerar dados para o Gráfico de Barras CSS
  const chartData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    paidOrders.forEach(o => {
      const d = new Date(o.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dailyMap[d] = (dailyMap[d] || 0) + o.total;
    });
    
    const data = Object.entries(dailyMap).map(([date, total]) => ({ date, total }));
    // Pega os últimos 7 dias com venda para não espremer o gráfico
    return data.slice(-7); 
  }, [paidOrders]);

  const maxDailyRevenue = Math.max(...chartData.map(d => d.total), 1); // Evita divisão por zero

  // 👇 CORREÇÃO DEFINITIVA: Fundo chumbado, texto branco e calendário em modo noturno nativo 👇
  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-[#111] text-white border border-gray-800 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all font-bold [color-scheme:dark]";

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="max-w-5xl mx-auto px-6 animate-fade-in">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-4 mb-8 border-b border-border pb-4">
          <Link to="/dashboard" className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm hover:-translate-x-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-3xl font-black text-primary drop-shadow-sm flex items-center gap-3">
            <LineChart className="w-8 h-8" /> Visão Geral e Faturamento
          </h2>
        </div>

        {/* FILTROS DE DATA */}
        <div className="bg-card border border-border rounded-3xl p-5 mb-8 flex flex-col md:flex-row gap-5 items-center shadow-sm">
          <div className="w-full md:flex-1">
            <label className="text-xs font-black text-muted-foreground block mb-2 uppercase tracking-widest">
              <CalendarDays className="w-4 h-4 inline mr-1 mb-0.5" /> Data Inicial
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={inputClass} />
          </div>
          <div className="w-full md:flex-1">
            <label className="text-xs font-black text-muted-foreground block mb-2 uppercase tracking-widest">
              <CalendarDays className="w-4 h-4 inline mr-1 mb-0.5" /> Data Final
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* MÁGICA VISUAL: SE NÃO TIVER VENDA, MOSTRA O AVISO. SE TIVER, MOSTRA OS DADOS */}
        {totalRevenue === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 flex flex-col items-center justify-center text-center shadow-lg animate-slide-up mt-4">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Store className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-2">Ainda não há vendas neste período</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Nenhum pedido finalizado e pago foi encontrado entre as datas selecionadas. Comece a operar o caixa para gerar os relatórios!
            </p>
            <Link to="/dashboard" className="px-8 py-4 rounded-xl bg-primary text-black font-black text-lg shadow-[0_0_20px_rgba(255,106,0,0.3)] hover:-translate-y-1 transition-all active:scale-95">
              Ir para o Painel de Pedidos
            </Link>
          </div>
        ) : (
          <div className="animate-slide-up">
            {/* CARDS DE KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              
              <div className="bg-card border border-primary/40 rounded-3xl p-6 shadow-[0_0_25px_rgba(255,106,0,0.15)] flex flex-col justify-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity group-hover:scale-110 duration-500 pointer-events-none">
                  <TrendingUp className="w-32 h-32 text-primary" />
                </div>
                <p className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  Faturamento Total
                </p>
                <p className="text-4xl font-black text-foreground mb-1 tracking-tight">R$ {totalRevenue.toFixed(2)}</p>
                <p className="text-xs font-bold text-muted-foreground mt-1 bg-background w-fit px-2 py-1 rounded-md border border-border/50">
                  {formatDate(new Date(startDate))} — {formatDate(new Date(endDate))}
                </p>
              </div>

              {/* Quantidade de Pedidos */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-xl"><Receipt className="w-5 h-5" /></div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pedidos Pagos</p>
                </div>
                <p className="text-4xl font-black text-foreground tracking-tight">{paidOrders.length}</p>
              </div>

              {/* Ticket Médio */}
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-center hover:border-green-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Ticket Médio</p>
                </div>
                <p className="text-4xl font-black text-foreground tracking-tight">R$ {ticketMedio.toFixed(2)}</p>
              </div>
            </div>

            {/* GRÁFICO DE BARRAS CSS */}
            {chartData.length > 0 && (
              <div className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-8">
                <h3 className="font-black text-muted-foreground mb-8 uppercase tracking-widest text-xs flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-primary" /> Desempenho por Dia (Últimos 7)
                </h3>
                <div className="flex items-end justify-around h-56 gap-3 pt-4 border-b border-border/50 pb-2 relative">
                  {/* Linhas de grade sutis no fundo */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                    <div className="border-t border-foreground w-full"></div>
                    <div className="border-t border-foreground w-full"></div>
                    <div className="border-t border-foreground w-full"></div>
                  </div>

                  {chartData.map((data, index) => {
                    const heightPercent = (data.total / maxDailyRevenue) * 100;
                    return (
                      <div key={index} className="flex flex-col items-center flex-1 group z-10">
                        {/* Tooltip de valor */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:-translate-y-1 bg-black border border-gray-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg mb-2 whitespace-nowrap shadow-xl">
                          R$ {data.total.toFixed(2)}
                        </div>
                        {/* Barra Brilhante */}
                        <div 
                          className="w-full max-w-[48px] bg-primary rounded-t-lg transition-all duration-700 shadow-[0_0_10px_rgba(255,106,0,0.2)] group-hover:shadow-[0_0_15px_rgba(255,106,0,0.5)] group-hover:brightness-110"
                          style={{ height: `${Math.max(heightPercent, 5)}%` }}
                        ></div>
                        <span className="text-[11px] font-bold text-muted-foreground mt-3">{data.date}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LISTA DE PEDIDOS ARQUIVADOS */}
            <h3 className="font-black text-foreground mb-4 text-xl flex items-center gap-2 mt-10">
              Histórico de Pedidos <span className="text-sm bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{orders.length}</span>
            </h3>
            
            <div className="space-y-3">
              {orders.map(order => (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:border-primary/50 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-black bg-muted px-2 py-1 rounded-md text-muted-foreground text-xs">
                        #{String(order.number).padStart(4, '0')}
                      </span>
                      <span className="font-bold text-foreground text-base group-hover:text-primary transition-colors">
                        {order.customerName}
                      </span>
                      {order.status === 'paid' ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Pago</span>
                      ) : (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Cancelado/Excluído</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="font-medium">{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </p>
                    <p className="text-sm mt-2 text-muted-foreground/80 italic border-l-2 border-border pl-3 py-0.5">
                      {order.items.map(i => `${i.quantity}x ${i.productName}`).join(' • ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xl text-foreground bg-background px-4 py-2 rounded-xl border border-border shadow-inner flex items-center gap-1 w-fit ml-auto">
                      <span className="text-sm text-muted-foreground">R$</span> {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}