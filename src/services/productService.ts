// src/services/productService.ts
import { supabase } from '@/lib/supabase';
import { Produto } from '@/types';

export async function getProdutosPorLoja(slugLoja: string): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, lojas!inner(slug), categorias(nome), subcategorias(nome)')
    .eq('lojas.slug', slugLoja)
    .eq('ativo', true);

  if (error) {
    console.error(`Erro ao buscar produtos da loja ${slugLoja}:`, error.message);
    return []; // Retorna um array vazio para o site não quebrar se houver falha de rede
  }

  return data as Produto[];
}
// Adicione esta nova função no seu productService.ts
export async function getProdutoPorId(id: number) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar produto por ID:', error);
    return null;
  }
  return data;
}