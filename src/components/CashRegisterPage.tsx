import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Wallet, CheckCircle2, XCircle, AlertTriangle, FileCheck, Loader2, CalendarDays, Receipt, Download } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase'; 

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function toInputDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export function CashRegisterPage() {
  const { getArchivedOrders } = useAppStore();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'initial' | 'difference' | 'closed'>('initial');
  const [differenceValue, setDifferenceValue] = useState('');
  const [notes, setNotes] = useState('');
  
  const [historyDate, setHistoryDate] = useState(() => toInputDate(new Date()));
  const [dailyClosings, setDailyClosings] = useState<any[]>([]);

  const [lastClosingTime, setLastClosingTime] = useState<number>(() => {
    const saved = localStorage.getItem('@gardens:lastClosure');
    return saved ? parseInt(saved, 10) : 0;
  });

  const fetchLatestClosure = async () => {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .order('id', { ascending: false })
      .limit(1);
      
    if (!error && data && data.length > 0) {
      const dbDateStr = data[0].created_at;
      if (dbDateStr) {
        const dbTime = new Date(dbDateStr).getTime();
        setLastClosingTime(prev => Math.max(prev, dbTime));
      }
    }
  };

  const fetchHistoryByDate = async () => {
    const start = new Date(`${historyDate}T00:00:00`).toISOString();
    const end = new Date(`${historyDate}T23:59:59.999`).toISOString();
    
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end)
      .order('id', { ascending: false });
      
    if (!error && data) {
      setDailyClosings(data);
    }
  };

  useEffect(() => {
    fetchLatestClosure();
  }, []);

  useEffect(() => {
    fetchHistoryByDate();
  }, [historyDate]);

  const unclosedOrders = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    
    let orders = getArchivedOrders(start, end).filter(o => o.status === 'paid');

    if (lastClosingTime > 0) {
      orders = orders.filter(o => {
        const orderTime = new Date(o.createdAt).getTime();
        return orderTime > lastClosingTime;
      });
    }

    return orders;
  }, [getArchivedOrders, lastClosingTime]);

  const expectedTotal = useMemo(() => {
    return unclosedOrders.reduce((sum, o) => sum + o.total, 0);
  }, [unclosedOrders]);

  const handleCloseRegister = async (hasDifference: boolean) => {
    const diff = hasDifference ? parseFloat(differenceValue) : 0;
    
    if (hasDifference && (isNaN(diff) || differenceValue === '')) {
      return toast.error('Digite um valor válido para a diferença.');
    }

    const reportedTotal = expectedTotal + diff;

    setLoading(true);
    try {
      const now = Date.now();
      localStorage.setItem('@gardens:lastClosure', now.toString());
      setLastClosingTime(now);
      setStep('closed');

      const { error } = await supabase.from('cash_closings').insert([{
        expected_total: expectedTotal,
        difference: diff,
        reported_total: reportedTotal,
        operator_name: user?.name || 'Operador',
        notes: notes || (diff === 0 ? 'Fechamento exato.' : 'Fechamento com divergência.'),
        closing_date: toInputDate(new Date()) 
      }]);

      if (error) throw error;

      toast.success('Caixa fechado com sucesso!');
      
      fetchHistoryByDate();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fechar o caixa.');
    } finally {
      setLoading(false);
    }
  };

  // 👇 NOVA FUNÇÃO: GERA PDF DO CAIXA SALTO GRANDE 👇
  const handleDownloadCashPDF = () => {
    if (dailyClosings.length === 0) {
      return toast.error("Não há fechamentos nesta data para gerar PDF.");
    }

    const doc = new jsPDF();

    // Cabeçalho
    doc.setFontSize(22);
    doc.setTextColor(255, 106, 0); // Laranja Salto Grande
    doc.text('SALTO GRANDE', 14, 20);
    
    doc.setFontSize(10);
    doc.text('GRILL E PETISCARIA', 14, 25);
    
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text('Auditoria: Fechamentos de Caixa', 14, 35);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data Analisada: ${new Date(historyDate + 'T12:00:00').toLocaleDateString('pt-BR')}`, 14, 41);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 46);

    const tableData = dailyClosings.map(closing => {
      const rawDate = closing.created_at || closing.closing_date;
      const dateText = rawDate ? new Date(rawDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
      return [
        dateText,
        closing.operator_name,
        `R$ ${closing.expected_total.toFixed(2)}`,
        `R$ ${closing.reported_total.toFixed(2)}`,
        closing.difference === 0 ? 'Exato' : `R$ ${closing.difference.toFixed(2)}`,
        closing.notes || '-'
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['Data/Hora', 'Operador', 'Sistema', 'Declarado', 'Diferença', 'Obs']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [255, 106, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`Caixa_Salto_Grande_${historyDate}.pdf`);
    toast.success("Download do PDF de Caixa iniciado!");
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-[#111] text-white border border-gray-800 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all font-bold [color-scheme:dark]";

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-6 animate-fade-in">
        
        <div className="flex items-center gap-4 mb-8 border-b border-border pb-4">
          <Link to="/dashboard" className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm hover:-translate-x-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-3xl font-black text-primary drop-shadow-sm flex items-center gap-3">
            <Wallet className="w-8 h-8" /> Fechamento de Caixa
          </h2>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Resumo do Turno Atual</p>
              <h3 className="text-2xl font-black text-foreground">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </h3>
            </div>
            <div className="bg-background border border-border px-4 py-2 rounded-xl">
              <p className="text-xs font-bold text-muted-foreground mb-0.5 uppercase text-center">Operador</p>
              <p className="font-black text-primary">{user?.name || 'Usuário Logado'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-inner">
              <p className="text-sm font-bold text-gray-400 mb-1">Novas Vendas (Após último fechamento)</p>
              <p className="text-4xl font-black text-white">{unclosedOrders.length}</p>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
              <Wallet className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold text-primary mb-1">Faturamento Pendente</p>
              <p className="text-4xl font-black text-foreground">R$ {expectedTotal.toFixed(2)}</p>
            </div>
          </div>

          {step === 'closed' ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center animate-slide-up">
              <FileCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-2xl font-black text-green-500 mb-2">Caixa Fechado!</h4>
              <p className="text-muted-foreground">O fechamento deste turno foi salvo no sistema.</p>
              <button 
                onClick={() => { setStep('initial'); setDifferenceValue(''); setNotes(''); }}
                className="mt-6 px-6 py-3 bg-background border border-border hover:border-primary text-foreground rounded-xl font-bold transition-all"
              >
                Iniciar Novo Turno
              </button>
            </div>
          ) : unclosedOrders.length === 0 && expectedTotal === 0 ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h4 className="text-2xl font-black text-green-500 mb-2">Caixa Zerado!</h4>
              <p className="text-green-500/80 font-medium">Não há novas vendas aguardando fechamento.</p>
            </div>
          ) : step === 'initial' ? (
            <div className="bg-background border border-border rounded-2xl p-6 text-center animate-fade-in">
              <h4 className="text-xl font-black text-foreground mb-2">O valor total em caixa está correto?</h4>
              <p className="text-muted-foreground text-sm mb-6">Confira a gaveta de dinheiro e as maquininhas antes de confirmar.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleCloseRegister(false)}
                  disabled={loading}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Sim, Bateu Exato</>}
                </button>
                <button 
                  onClick={() => setStep('difference')}
                  className="flex-1 py-4 bg-card border border-border hover:border-red-500 hover:text-red-500 text-foreground rounded-xl font-black shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" /> Não, deu diferença
                </button>
              </div>
            </div>
          ) : step === 'difference' ? (
            <div className="bg-background border border-red-500/30 rounded-2xl p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-lg font-black">Registrar Divergência</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block">Diferença em R$ (Use - para falta)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: -10.50 ou 5.00" 
                    value={differenceValue}
                    onChange={e => setDifferenceValue(e.target.value)}
                    className={inputClass} 
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 mb-2 block">Motivo / Observação</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Faltou troco" 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className={inputClass} 
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setStep('initial')}
                  className="px-6 py-4 bg-card border border-border hover:bg-muted text-foreground rounded-xl font-bold transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => handleCloseRegister(true)}
                  disabled={loading}
                  className="flex-1 py-4 bg-primary text-black rounded-xl font-black shadow-lg hover:shadow-[0_0_20px_rgba(255,106,0,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Fechamento'}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {unclosedOrders.length > 0 && (
          <div className="mb-12 animate-fade-in">
            <h3 className="font-black text-foreground mb-4 text-xl flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Auditoria de Vendas Pendentes 
              <span className="text-sm bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{unclosedOrders.length}</span>
            </h3>
            <div className="space-y-3">
              {unclosedOrders.map((order, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-black text-muted-foreground text-sm">#{String(order.number).padStart(4, '0')}</span>
                      <span className="font-bold text-foreground">{order.customerName}</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground italic mt-1">
                      {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <span className="text-[10px] font-black uppercase text-gray-500">{order.paymentMethod}</span>
                    <span className="font-black text-lg bg-[#111] px-3 py-1.5 rounded-lg border border-gray-800">
                      R$ {order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-12 border-t border-border pt-8">
          <h3 className="font-black text-foreground text-xl">Histórico de Fechamentos</h3>
          
          <div className="flex items-center gap-3">
            {/* 👇 BOTÃO NOVO: DOWNLOAD DO CAIXA 👇 */}
            <button 
              onClick={handleDownloadCashPDF}
              disabled={dailyClosings.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border hover:border-primary hover:text-primary text-foreground rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>

            <div className="flex items-center gap-2 bg-[#111] border border-gray-800 rounded-xl px-4 py-2 shadow-sm focus-within:border-primary transition-colors cursor-pointer group hover:border-primary/50">
              <CalendarDays className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <input 
                type="date" 
                value={historyDate} 
                onChange={e => setHistoryDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-white focus:outline-none [color-scheme:dark] cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {dailyClosings.length === 0 && (
            <p className="text-center py-10 text-muted-foreground bg-card rounded-2xl border border-dashed border-border font-medium shadow-sm">
              Nenhum fechamento registrado na data <span className="font-bold">{new Date(`${historyDate}T12:00:00`).toLocaleDateString('pt-BR')}</span>.
            </p>
          )}
          
          {dailyClosings.map(closing => {
             const rawDate = closing.created_at || closing.closing_date;
             const dateText = rawDate 
               ? new Date(rawDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
               : 'Data Indisponível';

             return (
              <div key={closing.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-all">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-black text-foreground text-lg">{dateText}</span>
                    {closing.difference === 0 ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Exato</span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Divergência</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Operador: <span className="font-bold">{closing.operator_name}</span></p>
                  {closing.notes && <p className="text-xs mt-1 italic text-muted-foreground/70 border-l-2 border-border pl-2">{closing.notes}</p>}
                </div>
                
                <div className="flex gap-6 bg-[#111] p-3 rounded-xl border border-gray-800 shadow-inner">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Sistema</p>
                    <p className="font-bold text-foreground">R$ {closing.expected_total.toFixed(2)}</p>
                  </div>
                  <div className="text-right border-l border-gray-800 pl-6">
                    <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Declarado</p>
                    <p className={`font-black ${closing.difference < 0 ? 'text-red-500' : closing.difference > 0 ? 'text-green-500' : 'text-primary'}`}>
                      R$ {closing.reported_total.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  );
}