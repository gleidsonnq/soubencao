"use client";

import { useState, useEffect, use } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ArrowLeft, MapPin, Store, ShoppingBag, CheckCircle, MessageCircle, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Loja {
  id: number;
  nome: string;
  slug: string;
}

export default function CheckoutPage({ params }: { params: Promise<{ loja: string }> }) {
  // Resolve o parâmetro da URL do Next.js 15 (ex: 'bencaostore' ou 'superluzardo')
  const { loja: lojaSlug } = use(params);
  
  const router = useRouter();
  // Puxamos as ações do Zustand para permitir alteração direta na tela
  const { items, updateQuantity, removeItem, clearCart } = useCartStore();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Estados do Formulário e da Loja Atual
  const [lojaAtual, setLojaAtual] = useState<Loja | null>(null);
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [cidade, setCidade] = useState('Maracanaú');
  const [endereco, setEndereco] = useState('');
  const [carregando, setCarregando] = useState(false);

  // 1. Busca os dados da loja atual com base na URL para garantir a independência
  useEffect(() => {
    async function carregarDadosLoja() {
      const { data } = await supabase
        .from('lojas')
        .select('id, nome, slug')
        .eq('slug', lojaSlug)
        .single();
      
      if (data) {
        setLojaAtual(data);
      } else {
        router.push('/'); // Se a loja não existir na URL, manda de volta ao portal
      }
    }
    carregarDadosLoja();
  }, [lojaSlug, supabase, router]);

  // 2. Redireciona se o carrinho estiver vazio
  useEffect(() => {
    if (items.length === 0) {
      router.push(`/${lojaSlug}`);
    }
  }, [items, router, lojaSlug]);

  // 1. Busca os dados da loja atual com base na URL para garantir a independência
  useEffect(() => {
    async function carregarDadosLoja() {
      const { data } = await supabase
        .from('lojas')
        .select('id, nome, slug')
        .eq('slug', lojaSlug)
        .single();
      
      if (data) {
        setLojaAtual(data);
      } else {
        router.push('/'); // Se a loja não existir na URL, manda de volta ao portal
      }
    }
    carregarDadosLoja();
  }, [lojaSlug, supabase, router]);

  // 2. Redireciona se o carrinho estiver vazio
  useEffect(() => {
    if (items.length === 0) {
      router.push(`/${lojaSlug}`);
    }
  }, [items, router, lojaSlug]);

  // 3. NOVO: Consulta automática do cliente pelo WhatsApp
  useEffect(() => {
    const whatsappLimpo = whatsapp.replace(/\D/g, '');
    
    // Dispara a consulta apenas quando o número atingir o tamanho padrão (10 ou 11 dígitos)
    if (whatsappLimpo.length === 10 || whatsappLimpo.length === 11) {
      async function buscarClienteExistente() {
        const { data: cliente, error } = await supabase
          .from('clientes')
          .select('nome, endereco')
          .eq('whatsapp', whatsappLimpo)
          .maybeSingle();

        if (error) {
          console.error('Erro ao consultar cliente:', error.message);
          return;
        }

        if (cliente) {
          if (cliente.nome) setNome(cliente.nome);
          
          if (cliente.endereco && cliente.endereco !== 'Retirada na Loja') {
            const partes = cliente.endereco.split(' - ');
            if (partes.length > 1) {
              const cidadeSalva = partes.pop(); 
              const enderecoSalvo = partes.join(' - '); 
              
              setEndereco(enderecoSalvo);
              if (cidadeSalva) setCidade(cidadeSalva);
            } else {
              setEndereco(cliente.endereco);
            }
          }
        }
      }
      buscarClienteExistente();
    }
  }, [whatsapp, supabase]);


  // Lógica de cálculo de valores dinâmicos
  const subtotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  
  const cidadeNormalizada = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const isMaracanau = cidadeNormalizada === 'maracanau';
  
  const taxaEntrega = tipoEntrega === 'retirada' ? 0 : (isMaracanau ? 10 : 0);
  const total = subtotal + taxaEntrega;
  const consultarTaxa = tipoEntrega === 'entrega' && !isMaracanau;

  const handleFinalizarCompra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lojaAtual) return;
    setCarregando(true);

    try {
      const enderecoCompleto = tipoEntrega === 'retirada' ? 'Retirada na Loja' : `${endereco} - ${cidade}`;
      const whatsappLimpo = whatsapp.replace(/\D/g, '');
      
      // 1. Grava ou atualiza os dados do cliente
      const { error: erroCliente } = await supabase
        .from('clientes')
        .upsert({ whatsapp: whatsappLimpo, nome, endereco: enderecoCompleto });

      if (erroCliente) throw new Error('Erro ao salvar cliente');

      // 2. Cria o Pedido amarrado ao ID da loja atual da URL
      const { data: pedido, error: erroPedido } = await supabase
        .from('pedidos')
        .insert([{
          cliente_whatsapp: whatsappLimpo,
          loja_id: lojaAtual.id, // <-- Totalmente independente por loja!
          total: total,
          status: 'pendente'
        }])
        .select('id')
        .single();

      if (erroPedido || !pedido) throw new Error('Erro ao gerar pedido');

      // 3. Insere os Itens do Pedido (disparando a baixa de estoque automática)
      const itensParaInserir = items.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        preco_unitario: item.preco
      }));

      const { error: erroItens } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir);

      if (erroItens) throw new Error('Erro ao salvar itens do pedido');

      // 4. Monta o resumo e redireciona ao WhatsApp (carrinho só é limpo após sucesso)
      const numeroLoja = "5585999999999"; 
      let textoMsg = `*Novo Pedido [${lojaAtual.nome}]: #${pedido.id.substring(0,6)}*\n\n`;
      textoMsg += `*Cliente:* ${nome}\n`;
      textoMsg += `*Tipo:* ${tipoEntrega === 'retirada' ? '🏪 Retirada na Loja' : '🚚 Entrega'}\n`;
      if (tipoEntrega === 'entrega') textoMsg += `*Endereço:* ${enderecoCompleto}\n`;
      textoMsg += `\n*Produtos:*\n`;
      items.forEach(i => {
        textoMsg += `- ${i.quantidade}x ${i.nome} (R$ ${i.preco.toFixed(2)})\n`;
      });
      textoMsg += `\n*Subtotal:* R$ ${subtotal.toFixed(2)}\n`;
      if (tipoEntrega === 'entrega') {
        textoMsg += consultarTaxa ? `*Taxa de Entrega:* A combinar\n` : `*Taxa de Entrega:* R$ ${taxaEntrega.toFixed(2)}\n`;
      }
      textoMsg += `*Total:* R$ ${total.toFixed(2)}\n`;

      const whatsappUrl = `https://wa.me/${numeroLoja}?text=${encodeURIComponent(textoMsg)}`;
      clearCart();
      
      window.open(whatsappUrl, '_blank');
      router.push(`/${lojaSlug}`);

    } catch (error) {
      console.error(error);
      alert('Erro ao processar pedido.');
      setCarregando(false);
    }
  };

  if (items.length === 0 || !lojaAtual) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href={`/${lojaSlug}`} className="hover:bg-blue-700 p-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold tracking-wide">Finalizar Pedido — {lojaAtual.nome}</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 mt-4 flex flex-col lg:flex-row gap-8">
        
        {/* FORMULÁRIO DO CLIENTE */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <CheckCircle className="text-blue-600" /> Identificação e Entrega
            </h2>
            
            <form id="checkout-form" onSubmit={handleFinalizarCompra} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nome Completo</label>
                  <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp (com DDD)</label>
                  <input type="tel" required placeholder="(85) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"/>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Forma de Envio</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button type="button" onClick={() => setTipoEntrega('entrega')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${tipoEntrega === 'entrega' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <MapPin size={24} />
                    <span className="font-bold text-sm">Receber em Casa</span>
                  </button>
                  <button type="button" onClick={() => setTipoEntrega('retirada')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${tipoEntrega === 'retirada' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    <Store size={24} />
                    <span className="font-bold text-sm">Retirar na Loja</span>
                  </button>
                </div>
              </div>

              {tipoEntrega === 'entrega' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cidade</label>
                    <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"/>
                    {consultarTaxa && (
                      <p className="text-xs text-amber-600 mt-1 font-semibold">⚠️ Taxa de entrega para fora de Maracanaú será combinada no atendimento.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Endereço Completo (Rua, Número, Bairro)</label>
                    <input type="text" required value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"/>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* RESUMO DO PEDIDO INTERATIVO (ALTERA QUANTIDADE / EXCLUI) */}
        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-28">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="text-blue-600" /> Carrinho de Compras
            </h2>

            {/* Lista com scroll caso tenha muitos itens */}
            <div className="space-y-4 mb-6 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-b-0 last:pb-0">
                  <div className="w-14 h-14 relative bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border">
                    <Image src={`https://s3.infra-queirozauto.cloud/${item.minio_path}`} alt={item.nome} fill sizes="56px" className="object-cover"/>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-1">
                      <p className="text-gray-800 font-semibold text-sm line-clamp-2 leading-tight">{item.nome}</p>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        title="Remover produto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <p className="text-blue-600 font-bold text-sm">
                        R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                      </p>
                      
                      {/* CONTROLE DE QUANTIDADE DINÂMICO */}
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-gray-800 font-bold text-xs w-4 text-center">{item.quantidade}</span>
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Produtos</span>
                <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {tipoEntrega === 'entrega' && (
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span>{consultarTaxa ? 'A combinar' : `R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-extrabold text-blue-600 pt-4 border-t border-gray-100">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={carregando}
              className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors mt-6 flex justify-center items-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
            >
              {carregando ? 'Finalizando Pedido...' : (
                <>Confirmar Pedido <MessageCircle size={20} /></>
              )}
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}