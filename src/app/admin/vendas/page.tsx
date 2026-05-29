"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ShoppingBag, Eye, RefreshCw, User, Phone, MapPin, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface ItemPedido {
  id: number;
  produto_id: number;
  quantidade: number;
  preco_unitario: number;
  produtos: {
    id: number;
    nome: string;
    codigo_referencia: string;
  } | null;
}

interface Pedido {
  id: string;
  total: number;
  status: string;
  criado_em: string;
  loja_id: number;
  lojas: { nome: string } | null;
  clientes: {
    nome: string;
    whatsapp: string;
    endereco: string;
  } | null;
  itens_pedido: ItemPedido[];
}

export default function GestaoVendasPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lojaAdminId, setLojaAdminId] = useState<number | null>(null);

  useEffect(() => {
    async function inicializarPainel() {
      setCarregando(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase.from('admin_perfis').select('loja_id, is_superadmin').eq('id', user.id).single();
        if (perfil) {
          setIsSuperAdmin(perfil.is_superadmin);
          setLojaAdminId(perfil.loja_id);
          await carregarPedidos(perfil.is_superadmin, perfil.loja_id);
        }
      }
      setCarregando(false);
    }
    inicializarPainel();
  }, [supabase]);

  async function carregarPedidos(superAdmin: boolean, lojaId: number | null) {
    let query = supabase
      .from('pedidos')
      .select(`id, total, status, criado_em, loja_id, lojas(nome), clientes!pedidos_cliente_whatsapp_fkey(nome, whatsapp, endereco), itens_pedido(id, produto_id, quantidade, preco_unitario, produtos(id, nome, codigo_referencia))`)
      .order('criado_em', { ascending: false });

    if (!superAdmin && lojaId) query = query.eq('loja_id', lojaId);
    const { data } = await query;
    if (data) setPedidos(data as unknown as Pedido[]);
  }

  // Lógica robusta de devolução de estoque (Query Direta)
  const devolverEstoque = async (itens: ItemPedido[]) => {
    for (const item of itens) {
      const idDoProduto = Number(item.produto_id || item.produtos?.id);
      const qtd = Number(item.quantidade);
      if (idDoProduto && qtd > 0) {
        const { data: prod } = await supabase.from('produtos').select('estoque').eq('id', idDoProduto).single();
        if (prod) {
          await supabase.from('produtos').update({ estoque: Number(prod.estoque) + qtd }).eq('id', idDoProduto);
        }
      }
    }
  };

  const handleAtualizarStatus = async (pedidoId: string, novoStatus: string) => {
    if (!window.confirm(`Confirmar status para "${novoStatus}"?`)) return;
    const { error } = await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedidoId);
    if (error) { alert("Erro ao atualizar status"); return; }
    
    if (novoStatus === 'cancelado') {
      const p = pedidos.find(x => x.id === pedidoId);
      if (p) await devolverEstoque(p.itens_pedido);
    }
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
    if (pedidoSelecionado?.id === pedidoId) setPedidoSelecionado(prev => prev ? { ...prev, status: novoStatus } : null);
  };

  const handleExcluirVenda = async (pedidoId: string) => {
    const p = pedidos.find(x => x.id === pedidoId);
    if (!p || !window.confirm("ATENÇÃO: Excluir esta venda permanentemente?")) return;

    let devolver = (p.status === 'pendente');
    if (p.status === 'concluido') devolver = window.confirm("Venda concluída. Devolver produtos ao estoque?");

    setCarregando(true);
    if (devolver) await devolverEstoque(p.itens_pedido);
    await supabase.from('itens_pedido').delete().eq('pedido_id', pedidoId);
    await supabase.from('pedidos').delete().eq('id', pedidoId);
    
    setPedidos(prev => prev.filter(x => x.id !== pedidoId));
    setPedidoSelecionado(null);
    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center">
           <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="text-blue-600"/> Painel de Pedidos</h1>
            <p className="text-sm text-gray-500">{isSuperAdmin ? "Visão Geral da Rede" : "Gerenciamento da Filial"}</p>
           </div>
           <button onClick={() => carregarPedidos(isSuperAdmin, lojaAdminId)} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors"><RefreshCw size={18}/></button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50 text-xs font-bold text-gray-500 uppercase"><th className="p-4">Pedido</th><th className="p-4">Cliente</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4 text-center">Ações</th></tr></thead>
              <tbody>
                {pedidos.filter(p => statusFiltro === 'todos' || p.status === statusFiltro).map(pedido => (
                  <tr key={pedido.id} className="border-t hover:bg-slate-50">
                    <td className="p-4 font-mono text-xs text-gray-500">#{pedido.id.substring(0,6).toUpperCase()}</td>
                    <td className="p-4 font-semibold">{pedido.clientes?.nome}</td>
                    <td className="p-4 text-sm font-bold">R$ {pedido.total.toFixed(2).replace('.',',')}</td>
                    <td className="p-4 capitalize text-sm font-semibold text-gray-600">{pedido.status}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => setPedidoSelecionado(pedido)} className="text-blue-600"><Eye size={18}/></button>
                      <button onClick={() => handleExcluirVenda(pedido.id)} className="text-red-600"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
            {pedidoSelecionado ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h2 className="font-bold border-b pb-2">Pedido #{pedidoSelecionado.id.substring(0,6).toUpperCase()}</h2>
                <div className="text-sm space-y-1">
                  <p><User size={14} className="inline mr-1"/> {pedidoSelecionado.clientes?.nome}</p>
                  <p><Phone size={14} className="inline mr-1"/> {pedidoSelecionado.clientes?.whatsapp}</p>
                  <p><MapPin size={14} className="inline mr-1"/> {pedidoSelecionado.clientes?.endereco}</p>
                </div>
                <div className="border-t pt-2 space-y-1">
                  {pedidoSelecionado.itens_pedido.map(item => (
                    <div key={item.id} className="flex justify-between text-xs bg-slate-50 p-2 rounded">
                      <span>{item.quantidade}x {item.produtos?.nome}</span>
                      <span className="font-bold">R$ {item.preco_unitario.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="font-bold text-lg pt-2 border-t">Total: R$ {pedidoSelecionado.total.toFixed(2).replace('.',',')}</div>
                
                {pedidoSelecionado.status === 'pendente' && (
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <button onClick={() => handleAtualizarStatus(pedidoSelecionado.id, 'cancelado')} className="bg-red-50 text-red-700 p-2 rounded-lg font-bold text-xs"><XCircle className="inline mr-1" size={14}/> Cancelar</button>
                    <button onClick={() => handleAtualizarStatus(pedidoSelecionado.id, 'concluido')} className="bg-green-600 text-white p-2 rounded-lg font-bold text-xs"><CheckCircle className="inline mr-1" size={14}/> Concluir</button>
                  </div>
                )}
              </div>
            ) : <p className="text-gray-400 text-center py-20">Selecione uma venda na lista.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}