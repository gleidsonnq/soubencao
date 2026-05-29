"use client";

import { useState, useMemo } from 'react';
import { PackageX, Search, Filter } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';

interface ProdutoCatalogo {
    id: number;
    nome: string;
    preco: number;
    minio_path: string;
    estoque: number;
    categorias?: { nome: string } | null;
    subcategorias?: { nome: string } | null;
  }

  export function StoreCatalog({ produtos }: { produtos: ProdutoCatalogo[] }) {
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('');
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState('');

  // 1. Descobre automaticamente quais Categorias existem na lista de produtos
  const categorias = useMemo(() => {
    const cats = new Set(produtos.map(p => p.categorias?.nome).filter(Boolean));
    return Array.from(cats) as string[];
  }, [produtos]);

  // 2. Descobre quais Subcategorias existem DENTRO da Categoria selecionada
  const subcategorias = useMemo(() => {
    if (!categoriaSelecionada) return [];
    const subcats = new Set(
      produtos
        .filter(p => p.categorias?.nome === categoriaSelecionada)
        .map(p => p.subcategorias?.nome)
        .filter(Boolean)
    );
    return Array.from(subcats) as string[];
  }, [produtos, categoriaSelecionada]);

  // 3. Aplica os 3 filtros (Nome, Categoria e Subcategoria)
  const produtosFiltrados = useMemo(() => {
    return produtos.filter(p => {
      const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
      const matchCat = categoriaSelecionada ? p.categorias?.nome === categoriaSelecionada : true;
      const matchSub = subcategoriaSelecionada ? p.subcategorias?.nome === subcategoriaSelecionada : true;
      
      return matchBusca && matchCat && matchSub;
    });
  }, [produtos, busca, categoriaSelecionada, subcategoriaSelecionada]);

  // Limpa a subcategoria sempre que o usuário trocar a categoria principal
  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaSelecionada(e.target.value);
    setSubcategoriaSelecionada(''); // Reseta a subcategoria
  };

  return (
    <div>
      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4">
        
        {/* Campo de Pesquisa por Nome */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome do produto..." 
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {/* Filtro de Categoria */}
        <div className="md:w-64">
          <select 
            value={categoriaSelecionada} 
            onChange={handleCategoriaChange}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 cursor-pointer"
          >
            <option value="">Todas as Categorias</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Filtro de Subcategoria */}
        <div className="md:w-64">
          <select 
            value={subcategoriaSelecionada} 
            onChange={(e) => setSubcategoriaSelecionada(e.target.value)}
            disabled={!categoriaSelecionada || subcategorias.length === 0}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="">Todas as Subcategorias</option>
            {subcategorias.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULTADO DA BUSCA / LISTA DE PRODUTOS */}
      {produtosFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
          <PackageX size={64} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum produto encontrado com estes filtros.</p>
          <button 
            onClick={() => { setBusca(''); setCategoriaSelecionada(''); setSubcategoriaSelecionada(''); }}
            className="mt-4 text-blue-600 hover:underline font-semibold"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {produtosFiltrados.map((produto, index) => (
            <ProductCard 
              key={produto.id}
              id={produto.id}
              nome={produto.nome}
              preco={produto.preco}
              minioPath={produto.minio_path}
              estoque={produto.estoque}
              priority={index < 4}
            />
          ))}
        </div>
      )}
    </div>
  );
}