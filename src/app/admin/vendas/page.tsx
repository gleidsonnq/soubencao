"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ShoppingBag, Clock, CheckCircle, XCircle, Eye, RefreshCw, User, Phone, MapPin } from 'lucide-react';

interface ItemPedido {
  id: number;
  quantidade: number;
  preco_unitario: number;
  produtos: {
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

  // Estados de controle
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<Pedido | null>(null);
  
  // Controle de permissões do Admin logado
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lojaAdminId, setLojaAdminId] = useState<number | null>(null);

  // 1. Carrega o perfil do administrador e as vendas correspondentes
  useEffect(() => {
    async function inicializarPainel() {
      setCarregando(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: perfil } = await supabase
          .from('admin_perfis')
          .select('loja_id, is_superadmin')
          .eq('id', user.id)
          .single();

        if (perfil) {
          setIsSuperAdmin(perfil.is_superadmin);
          setLojaAdminId(perfil.loja_id);
          await carregarPedidos(perfil.is_superadmin, perfil.loja_id);
        }
      }
    }
    inicializarPainel();
  }, [supabase]);

  // 2. Busca as vendas no banco aplicando a regra Multi-Tenant
  async function carregarPedidos(superAdmin: boolean, lojaId: number | null) {
    let query = supabase
      .from('pedidos')
      .select(`
        id, total, status, criado_em, loja_id,
        lojas ( nome ),
        clientes ! pedidos_cliente_whatsapp_fkey ( nome, whatsapp, endereco ),
        itens_pedido ( id, quantidade, preco_unitario, produtos ( nome, codigo_referencia ) )
      `)
      .order('criado_em', { ascending: false });

    // Se não for Super Admin, filtra estritamente pela loja do gerente
    if (!superAdmin && lojaId) {
      query = query.eq('loja_id', lojaId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Erro real do Supabase:', error.message, error.details, error.hint);
    } else if (data) {
      setPedidos(data as unknown as Pedido[]);
    }
    setCarregando(false);
  }

  // 3. Atualiza o status do pedido (Gatilha a baixa/estorno no banco)
  const handleAtualizarStatus = async (pedidoId: string, novoStatus: string) => {
    const confirmar = window.confirm(`Deseja alterar o status do pedido para "${novoStatus}"? This action cannot be undone.`);
    if (!confirmar) return;

    const { error } = await supabase
      .from('pedidos')
      .update({ status: novoStatus })
      .eq('id', pedidoId);

    if (error) {
      alert(`Erro ao atualizar status: ${error.message}`);
    } else {
      // Atualiza o estado local para refletir a mudança imediatamente na tela
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: novoStatus } : p));
      if (pedidoSelecionado && pedidoSelecionado.id === pedidoId) {
        setPedidoSelecionado(prev => prev ? { ...prev, status: novoStatus } : null);
      }
      alert('Status atualizado com sucesso! 🎉');
    }
  };

  // Filtra os pedidos na tela com base no botão selecionado
  const pedidosFiltrados = pedidos.filter(p => statusFiltro === 'todos' || p.status === statusFiltro);

  if (carregando) {
    return <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center font-bold text-gray-500">Carregando painel de vendas...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" /> Painel de Pedidos e Vendas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isSuperAdmin ? "Visão Geral da Rede (Super Admin)" : `Gerenciamento da filial`}
            </p>
          </div>
          <button 
            onClick={() => carregarPedidos(isSuperAdmin, lojaAdminId)}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw size={16} /> Atualizar Lista
          </button>
        </div>

        {/* FILTROS DE STATUS */}
        <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
          {[
            { id: 'todos', label: 'Todos os Pedidos', color: 'bg-slate-100 text-slate-700' },
            { id: 'pendente', label: 'Pendentes', color: 'bg-amber-100 text-amber-700' },
            { id: 'concluido', label: 'Concluídos', color: 'bg-green-100 text-green-700' },
            { id: 'cancelado', label: 'Cancelados', color: 'bg-red-100 text-red-700' }
          ].map(filtro => (
            <button
              key={filtro.id}
              onClick={() => setStatusFiltro(filtro.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statusFiltro === filtro.id ? `${filtro.color} ring-2 ring-offset-1 ring-slate-400` : 'text-gray-500 hover:bg-slate-50'}`}
            >
              {filtro.label}
            </button>
          ))}
        </div>

        {/* ÁREA PRINCIPAL: LISTA E DETALHES */}
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          
          {/* TABELA / LISTA DE PEDIDOS */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-xs font-bold text-gray-600 uppercase tracking-wider">
                    <th className="p-4">Pedido ID</th>
                    {isSuperAdmin && <th className="p-4">Loja</th>}
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {pedidosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={isSuperAdmin ? 6 : 5} className="p-8 text-center text-gray-400 font-medium">
                        Nenhum pedido encontrado nesta categoria.
                      </td>
                    </tr>
                  ) : (
                    pedidosFiltrados.map(pedido => (
                      <tr key={pedido.id} className={`hover:bg-slate-50/80 transition-colors ${pedidoSelecionado?.id === pedido.id ? 'bg-blue-50/40' : ''}`}>
                        <td className="p-4 font-mono font-bold text-gray-400 text-xs">
                          #{pedido.id.substring(0, 6).toUpperCase()}
                        </td>
                        {isSuperAdmin && (
                          <td className="p-4 font-semibold text-gray-700">
                            {pedido.lojas?.nome || 'Geral'}
                          </td>
                        )}
                        <td className="p-4">
                          <p className="font-semibold text-gray-900 leading-tight">{pedido.clientes?.nome || 'Não Identificado'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{new Date(pedido.criado_em).toLocaleDateString('pt-BR')}</p>
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          R$ {pedido.total.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            pedido.status === 'concluido' ? 'bg-green-50 text-green-700 border border-green-200' :
                            pedido.status === 'cancelado' ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {pedido.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => setPedidoSelecionado(pedido)}
                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                            title="Ver detalhes da venda"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAINEL LATERAL DE DETALHES DA VENDA */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6 sticky top-6">
            {pedidoSelecionado ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Pedido #{pedidoSelecionado.id.substring(0, 6).toUpperCase()}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Realizado em {new Date(pedidoSelecionado.criado_em).toLocaleString('pt-BR')}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    pedidoSelecionado.status === 'concluido' ? 'bg-green-100 text-green-800' :
                    pedidoSelecionado.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {pedidoSelecionado.status.toUpperCase()}
                  </span>
                </div>

                {/* DADOS DO CLIENTE */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Informações do Cliente</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="flex items-center gap-2"><User size={16} className="text-gray-400" /> <span className="font-semibold">{pedidoSelecionado.clientes?.nome}</span></p>
                    <p className="flex items-center gap-2"><Phone size={16} className="text-gray-400" /> {pedidoSelecionado.clientes?.whatsapp}</p>
                    <p className="flex items-center gap-2 items-start"><MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" /> <span className="leading-tight">{pedidoSelecionado.clientes?.endereco}</span></p>
                  </div>
                </div>

                {/* PRODUTOS COMPRADOS */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produtos Comprados</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {pedidoSelecionado.itens_pedido.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-semibold text-gray-800 truncate leading-tight">{item.produtos?.nome || 'Produto Removido'}</p>
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">{item.produtos?.codigo_referencia}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-900">{item.quantidade}x</p>
                          <p className="text-xs text-gray-500">R$ {item.preco_unitario.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOTAL */}
                <div className="flex justify-between items-center bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-blue-900">
                  <span className="font-bold text-sm">Valor Total Pago:</span>
                  <span className="text-xl font-extrabold">R$ {pedidoSelecionado.total.toFixed(2).replace('.', ',')}</span>
                </div>

                {/* BOTÕES DE CONTROLE DE STATUS */}
                {pedidoSelecionado.status === 'pendente' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleAtualizarStatus(pedidoSelecionado.id, 'cancelado')}
                      className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 py-3 rounded-xl font-bold text-sm transition-all border border-red-200"
                    >
                      <XCircle size={16} /> Cancelar / Estornar
                    </button>
                    <button
                      onClick={() => handleAtualizarStatus(pedidoSelecionado.id, 'concluido')}
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-sm"
                    >
                      <CheckCircle size={16} /> Concluir Venda
                    </button>
                  </div>
                )}
                
                {pedidoSelecionado.status !== 'pendente' && (
                  <p className="text-center text-xs text-gray-400 font-medium italic bg-slate-50 p-3 rounded-xl border">
                    Este pedido foi finalizado como {pedidoSelecionado.status} e não pode sofrer novas alterações.
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center gap-2">
                <ShoppingBag size={32} className="stroke-[1.5]" />
                <p className="text-sm font-medium">Selecione uma venda na lista para visualizar o resumo detalhado e gerenciar os status.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}