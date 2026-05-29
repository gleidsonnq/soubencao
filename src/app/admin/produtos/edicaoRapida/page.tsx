"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Search } from 'lucide-react';

interface Produto {
  id: number;
  nome: string;
  estoque: number;
  preco: number;
  codigo_referencia: string | null;
  codigo_barras: string | null;
}

export default function AjusteRapidoPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function carregarProdutos() {
      const { data } = await supabase
        .from('produtos')
        .select('id, nome, estoque, preco, codigo_referencia, codigo_barras');
      if (data) setProdutos(data as Produto[]);
    }
    carregarProdutos();
  }, [supabase]);

  const atualizarCampo = async (id: number, campo: keyof Produto, valor: string | number) => {
    await supabase.from('produtos').update({ [campo]: valor }).eq('id', id);
  };

  const filtrados = produtos.filter(p => 
    p.nome?.toLowerCase().includes(busca.toLowerCase()) || 
    p.codigo_referencia?.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo_barras?.includes(busca)
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ajuste Rápido: Preço e Estoque</h1>
      
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-2 border">
        <Search className="text-gray-400" />
        <input 
          autoFocus
          placeholder="Bipar ou digitar: nome, SKU ou Código de Barras..." 
          className="w-full outline-none p-2" 
          onChange={(e) => setBusca(e.target.value)} 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-xs uppercase text-gray-600">
            <tr><th className="p-4">Produto</th><th className="p-4">SKU / Barras</th><th className="p-4">Estoque</th><th className="p-4">Preço (R$)</th></tr>
          </thead>
          <tbody>
            {filtrados.map(p => (
              <tr key={p.id} className="border-t hover:bg-slate-50">
                <td className="p-4 font-semibold">{p.nome}</td>
                <td className="p-4 text-xs text-gray-400">{p.codigo_referencia || p.codigo_barras || '-'}</td>
                <td className="p-4">
                  <input type="number" defaultValue={p.estoque} className="w-20 p-2 border rounded" onBlur={(e) => atualizarCampo(p.id, 'estoque', Number(e.target.value))} />
                </td>
                <td className="p-4">
                  <input type="number" step="0.01" defaultValue={p.preco} className="w-24 p-2 border rounded" onBlur={(e) => atualizarCampo(p.id, 'preco', Number(e.target.value))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}