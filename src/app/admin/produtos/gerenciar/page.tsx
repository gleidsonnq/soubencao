"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

interface Produto {
  id: number;
  nome: string;
  preco: number;
  codigo_referencia: string;
  ativo: boolean;
  categorias: {
    nome: string;
  } | null;
  // 1. ADICIONAMOS A SUBCATEGORIA NA INTERFACE
  subcategorias: {
    nome: string;
  } | null;
}

export default function GerenciarProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. CARREGAMENTO INICIAL: Isolado e 100% assíncrono
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      const { data, error } = await supabase
        .from('produtos')
        // 2. PEDIMOS PARA TRAZER A SUBCATEGORIA NO SELECT
        .select('*, categorias(nome), subcategorias(nome)')
        .order('id', { ascending: false });

      if (!error && data) {
        setProdutos(data);
      }
      setCarregando(false);
    };

    carregarDadosIniciais();
  }, [supabase]);

  // 2. EXCLUSÃO E RECARREGAMENTO: Totalmente separado do useEffect
  const handleExcluir = async (id: number, nome: string) => {
    const confirmacao = window.confirm(`ATENÇÃO: Deseja realmente excluir o produto "${nome}"? Esta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    setCarregando(true);

    // Apaga o produto
    const { error: erroDelete } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (erroDelete) {
      alert("Erro ao excluir: " + erroDelete.message);
      setCarregando(false);
      return;
    }

    // Busca a lista atualizada logo após apagar (COM A SUBCATEGORIA TAMBÉM)
    const { data: dadosAtualizados, error: erroBusca } = await supabase
      .from('produtos')
      .select('*, categorias(nome), subcategorias(nome)')
      .order('id', { ascending: false });

    if (!erroBusca && dadosAtualizados) {
      setProdutos(dadosAtualizados);
    }
    
    setCarregando(false);
  };

  if (carregando) return <div className="p-8 font-bold text-gray-600">Carregando catálogo...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Gerenciar Produtos</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm">
              <th className="p-4 font-semibold text-gray-600">SKU</th>
              <th className="p-4 font-semibold text-gray-600">Nome do Produto</th>
              {/* ATUALIZAMOS O TÍTULO DA COLUNA */}
              <th className="p-4 font-semibold text-gray-600">Categoria / Sub</th>
              <th className="p-4 font-semibold text-gray-600">Preço</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map((produto) => (
              <tr key={produto.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4 text-gray-500 font-mono text-sm">{produto.codigo_referencia || '-'}</td>
                <td className="p-4 font-bold text-gray-800">{produto.nome}</td>
                
                {/* 3. EXIBIMOS A CATEGORIA E A SUBCATEGORIA SE ELA EXISTIR */}
                <td className="p-4 text-gray-600 text-sm">
                  <span className="font-semibold">{produto.categorias?.nome || 'Geral'}</span>
                  {produto.subcategorias?.nome && (
                    <span className="text-gray-400 ml-1">
                      &gt; {produto.subcategorias.nome}
                    </span>
                  )}
                </td>

                <td className="p-4 text-gray-800 font-medium">R$ {produto.preco?.toFixed(2)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs rounded-md font-bold ${produto.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 flex justify-center gap-2">
                  <Link 
                    href={`/admin/produtos/editar/${produto.id}`}
                    className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Editar
                  </Link>
                  <button 
                    onClick={() => handleExcluir(produto.id, produto.nome)}
                    className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {produtos.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum produto cadastrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}