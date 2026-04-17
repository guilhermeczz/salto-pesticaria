import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { ArrowLeft, Wallet, CheckCircle2, XCircle, AlertTriangle, FileCheck, Loader2, Receipt, Banknote, DollarSign, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export const Route = createFileRoute('/cash-register')({
  component: CashRegisterPage,
});

function CashRegisterPage() {
  const { getArchivedOrders } = useAppStore();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [closingsHistory, setClosingsHistory] = useState<any[]>([]);
  const [step, setStep] = useState<'initial' | 'difference' | 'closed'>('initial');
  const [differenceValue, setDifferenceValue] = useState('');
  const [notes, setNotes] = useState('');

  // Pega apenas as vendas de HOJE (00:00 até 23:59)
  const todayOrders = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return getArchivedOrders(start, end).filter((o: any) => o.status === 'paid');
  }, [getArchivedOrders]);

  const expectedTotal = useMemo(() => {
    return todayOrders.reduce((sum: number, o: any) => sum + o.total, 0);
  }, [todayOrders]);

  // 👇 NOVO: Calcula os totais separados por forma de pagamento
 // 👇 CÁLCULO CORRIGIDO: À prova de maiúsculas, minúsculas e acentos
  const stats = useMemo(() => {
    const totals = { pix: 0, dinheiro: 0, credito: 0, debito: 0 };
    
    todayOrders.forEach((o: any) => {
      const valor = o.total || 0;
      
      // Pega o nome do pagamento, transforma tudo em minúsculo e tira os espaços
      const method = String(o.paymentMethod || '').toLowerCase().trim();

      if (method === 'pix') {
        totals.pix += valor;
      } else if (method === 'dinheiro') {
        totals.dinheiro += valor;
      } else if (method.includes('credito') || method.includes('crédito')) {
        totals.credito += valor;
      } else if (method.includes('debito') || method.includes('débito')) {
        totals.debito += valor;
      } else if (method === 'cartão' || method === 'cartao') {
        // Caso o sistema salve apenas como "Cartão", ele joga na caixinha de crédito
        totals.credito += valor;
      }
    });
    
    return totals;
  }, [todayOrders]);
  
  const fetchHistory = async () => {
    const { data, error } = await supabase
      .from('cash_closings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!error && data) setClosingsHistory(data);
  };

  const handleCloseRegister = async (hasDifference: boolean) => {
    const diff = hasDifference ? parseFloat(differenceValue) : 0;
    
    if (hasDifference && (isNaN(diff) || differenceValue === '')) {
      return toast.error('Digite um valor válido para a diferença.');
    }

    const reportedTotal = expectedTotal + diff;

    setLoading(true);
    try {
      const { error } = await supabase.from('cash_closings').insert([{
        expected_total: expectedTotal,
        difference: diff,
        reported_total: reportedTotal,
        operator_name: user?.name || 'Operador',
        notes: notes || (diff === 0 ? 'Fechamento exato.' : 'Fechamento com divergência.')
      }]);

      if (error) throw error;

      toast.success('Caixa fechado com sucesso!');
      setStep('closed');
      fetchHistory(); 
    } catch (err) {
      console.error(err);
      toast.error('Erro ao fechar o caixa.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-[#111] text-white border border-gray-800 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(255,106,0,0.3)] transition-all font-bold";

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="max-w-4xl mx-auto px-6 animate-fade-in">
        
        {/* CABEÇALHO */}
        <div className="flex items-center gap-4 mb-8 border-b border-border pb-4">
          <Link to="/dashboard" className="p-2.5 bg-card border border-border rounded-xl text-muted-foreground hover:text-primary hover:border-primary transition-all active:scale-95 shadow-sm hover:-translate-x-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-3xl font-black text-primary drop-shadow-sm flex items-center gap-3">
            <Wallet className="w-8 h-8" /> Fechamento de Caixa
          </h2>
        </div>

        {/* ÁREA DE FECHAMENTO */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <p className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-1">Resumo de Hoje</p>
              <h3 className="text-2xl font-black text-foreground capitalize">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
              </h3>
            </div>
            <div className="bg-background border border-border px-4 py-2 rounded-xl shadow-inner">
              <p className="text-[10px] font-black text-muted-foreground mb-0.5 uppercase tracking-wider text-center">Operador do Caixa</p>
              <p className="font-black text-primary text-center">{user?.name || 'Usuário Logado'}</p>
            </div>
          </div>

          {/* 👇 NOVO: Caixinhas de Métodos de Pagamento (Teste 5.1) 👇 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Dinheiro" value={stats.dinheiro} icon={<Banknote className="w-4 h-4"/>} color="text-green-500" />
            <StatCard label="PIX" value={stats.pix} icon={<DollarSign className="w-4 h-4"/>} color="text-teal-500" />
            <StatCard label="Crédito" value={stats.credito} icon={<CreditCard className="w-4 h-4"/>} color="text-blue-500" />
            <StatCard label="Débito" value={stats.debito} icon={<CreditCard className="w-4 h-4"/>} color="text-purple-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 shadow-inner flex flex-col justify-center">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Pedidos Pagos</p>
              <p className="text-4xl font-black text-white">{todayOrders.length}</p>
            </div>
            <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
              <Wallet className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-black text-primary uppercase tracking-widest mb-2">Faturamento no Sistema</p>
              <p className="text-4xl font-black text-foreground tracking-tight">R$ {expectedTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* FLUXO DE CONFIRMAÇÃO */}
          {step === 'initial' && (
            <div className="bg-background border border-border rounded-2xl p-6 text-center animate-fade-in shadow-inner">
              <h4 className="text-xl font-black text-foreground mb-2">O valor total em caixa está correto?</h4>
              <p className="text-muted-foreground text-sm mb-6">Confira a gaveta de dinheiro e as maquininhas antes de confirmar o fechamento do seu turno.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => handleCloseRegister(false)}
                  disabled={loading || expectedTotal === 0}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black shadow-lg hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Sim, Bateu Exato</>}
                </button>
                <button 
                  onClick={() => setStep('difference')}
                  disabled={expectedTotal === 0}
                  className="flex-1 py-4 bg-card border border-border hover:border-red-500 hover:text-red-500 text-foreground rounded-xl font-black shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" /> Não, deu diferença
                </button>
              </div>
              {expectedTotal === 0 && (
                <p className="text-xs text-red-500 mt-4 font-bold">Realize pelo menos uma venda hoje para fechar o caixa.</p>
              )}
            </div>
          )}

          {step === 'difference' && (
            <div className="bg-background border border-red-500/30 rounded-2xl p-6 animate-slide-up shadow-inner">
              <div className="flex items-center gap-3 mb-6 text-red-500">
                <AlertTriangle className="w-6 h-6" />
                <h4 className="text-lg font-black">Registrar Divergência</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Diferença em R$ (Use - para falta)</label>
                  <input 
                    type="number" 
                    placeholder="Ex: -10.50 ou 5.00" 
                    value={differenceValue}
                    onChange={e => setDifferenceValue(e.target.value)}
                    className={inputClass} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 mb-2 block uppercase tracking-wider">Motivo / Observação</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Faltou troco na gaveta" 
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
          )}

          {step === 'closed' && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 text-center animate-slide-up">
              <FileCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-2xl font-black text-green-500 mb-2">Caixa Fechado com Sucesso!</h4>
              <p className="text-muted-foreground font-medium">O registro do turno foi salvo no sistema com segurança.</p>
              <button 
                onClick={() => setStep('initial')}
                className="mt-6 px-8 py-3 bg-background border border-border hover:border-primary text-foreground rounded-xl font-bold transition-all active:scale-95"
              >
                Fazer novo registro
              </button>
            </div>
          )}
        </div>

        {/* AUDITORIA DE VENDAS */}
        <div className="mb-10">
          <h3 className="font-black text-foreground mb-4 text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-muted-foreground" /> 
            Auditoria de Vendas de Hoje
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full ml-2">{todayOrders.length}</span>
          </h3>
          
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="max-h-[300px] overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
              {todayOrders.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground font-medium text-sm">
                  Nenhuma venda concluída hoje ainda.
                </p>
              ) : (
                todayOrders.map((order: any) => (
                  <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                          #{String(order.number).padStart(4, '0')}
                        </span>
                        <span className="font-bold text-sm text-foreground">{order.customerName}</span>
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-green-500/10 text-green-500">
                          {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground/80 italic">
                        {order.items.map((i: any) => `${i.quantity}x ${i.productName}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex items-center gap-3">
                      {/* Badge do método de pagamento */}
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">
                        {order.paymentMethod || 'Não def.'}
                      </span>
                      <span className="font-black text-sm text-foreground bg-background px-2.5 py-1 rounded-lg border border-border">
                        R$ {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* HISTÓRICO DE FECHAMENTOS */}
        <h3 className="font-black text-foreground mb-4 text-xl mt-10">Últimos Fechamentos</h3>
        <div className="space-y-3">
          {closingsHistory.length === 0 && (
            <p className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-dashed border-border font-medium">
              Nenhum fechamento registrado no banco de dados.
            </p>
          )}
          {closingsHistory.map(closing => (
            <div key={closing.id} className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-primary/50 transition-all">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-black text-foreground text-lg">
                    {new Date(closing.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </span>
                  {closing.difference === 0 ? (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">Exato</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">Divergência</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Operador: <span className="font-bold">{closing.operator_name}</span></p>
                {closing.notes && <p className="text-xs mt-1 italic text-muted-foreground/70 border-l-2 border-border pl-2">{closing.notes}</p>}
              </div>
              
              <div className="flex gap-6 bg-[#111] p-3 rounded-xl border border-gray-800">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Sistema</p>
                  <p className="font-bold text-foreground">R$ {Number(closing.expected_total).toFixed(2)}</p>
                </div>
                <div className="text-right border-l border-gray-800 pl-6">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Declarado</p>
                  <p className={`font-black ${closing.difference < 0 ? 'text-red-500' : closing.difference > 0 ? 'text-green-500' : 'text-primary'}`}>
                    R$ {Number(closing.reported_total).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// Componente visual dos cards de valores
function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-background border border-border p-4 rounded-2xl shadow-sm hover:border-primary/50 transition-colors">
      <div className={`flex items-center gap-2 mb-2 text-xs font-black uppercase tracking-wider ${color}`}>
        {icon} {label}
      </div>
      <div className="text-2xl font-black text-foreground">
        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
}