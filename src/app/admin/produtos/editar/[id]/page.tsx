"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { resizeAndConvertToPNG } from '@/utils/imageProcessor';
import { X, UploadCloud } from 'lucide-react';

interface Categoria {
  id: number;
  nome: string;
}

export default function EditarProdutoPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Desempacota o ID (Padrão Next.js 15)
  const { id: produtoId } = use(params);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Estados do Produto
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [sku, setSku] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [lojaSlug, setLojaSlug] = useState('loja');
  const [categoriaSlug, setCategoriaSlug] = useState('geral');
  
  // Estados da Galeria de Imagens
  const [galeriaAtual, setGaleriaAtual] = useState<string[]>([]); // Fotos que já estão no banco
  const [imagensNovas, setImagensNovas] = useState<File[]>([]);   // Fotos novas que o usuário quer adicionar
  
  // Estados de Controle
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [status, setStatus] = useState('Carregando produto...');
  const [salvando, setSalvando] = useState(false);

  // BASE URL DO MINIO PARA EXIBIR AS FOTOS ATUAIS
  const MINIO_BASE_URL = 'https://s3.infra-queirozauto.cloud';

  // 1. Carrega o produto e as categorias
  useEffect(() => {
    async function carregarDados() {
      const { data: produto, error } = await supabase
        .from('produtos')
        .select('*, lojas(slug), categorias(slug, nome)')
        .eq('id', produtoId)
        .single();

      if (error || !produto) {
        setStatus('Erro ao carregar produto.');
        return;
      }

      setNome(produto.nome);
      setDescricao(produto.descricao || '');
      setPreco(produto.preco.toString());
      setSku(produto.codigo_referencia || '');
      setAtivo(produto.ativo);
      setCategoriaId(produto.categoria_id);
      
      if (produto.lojas?.slug) setLojaSlug(produto.lojas.slug);
      if (produto.categorias?.slug) setCategoriaSlug(produto.categorias.slug);

      // Carrega a galeria (se existir)
      if (produto.galeria && Array.isArray(produto.galeria)) {
        setGaleriaAtual(produto.galeria);
      } else if (produto.minio_path) {
        // Fallback caso o produto seja antigo e só tenha a foto principal
        setGaleriaAtual([produto.minio_path]);
      }

      // Busca todas as categorias da mesma loja para o select
      const { data: cats } = await supabase
        .from('categorias')
        .select('id, nome')
        .eq('loja_id', produto.loja_id);
        
      if (cats) setCategorias(cats);
      setStatus('');
    }
    carregarDados();
  }, [produtoId, supabase]);

  // 2. Adicionar novas fotos à fila
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setStatus(`Processando ${e.target.files.length} nova(s) imagem(ns)...`);
        
        const filesArray = Array.from(e.target.files);
        const filesProntos = await Promise.all(
          filesArray.map(file => resizeAndConvertToPNG(file))
        );
        
        // Adiciona as novas fotos mantendo as que já estavam na fila
        setImagensNovas(prev => [...prev, ...filesProntos]);
        setStatus('');
      } catch (err) {
        setStatus('Erro ao processar imagens.');
      }
    }
  };

  // 3. Funções para remover fotos da interface
  const removerDaGaleriaAtual = (indexParaRemover: number) => {
    setGaleriaAtual(prev => prev.filter((_, index) => index !== indexParaRemover));
  };

  const removerImagemNova = (indexParaRemover: number) => {
    setImagensNovas(prev => prev.filter((_, index) => index !== indexParaRemover));
  };

  // 4. Salva as alterações
  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setStatus('Salvando alterações...');

    try {
      let caminhosNovos: string[] = [];

      // Se houver fotos novas, faz o upload para o MinIO
      if (imagensNovas.length > 0) {
        setStatus(`Enviando ${imagensNovas.length} nova(s) imagem(ns) para o servidor...`);
        
        caminhosNovos = await Promise.all(
          imagensNovas.map(async (img, index) => {
            const minioPathFinal = `${lojaSlug}/${categoriaSlug}/${Date.now()}-${index}-${img.name}`; 
            
            const formData = new FormData();
            formData.append('file', img);
            formData.append('path', minioPathFinal);

            const response = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) throw new Error('Falha no upload para o MinIO');
            
            return minioPathFinal;
          })
        );
      }

      // Junta as fotos que restaram no banco com as novas fotos enviadas
      const galeriaFinal = [...galeriaAtual, ...caminhosNovos];

      if (galeriaFinal.length === 0) {
        alert('Atenção: O produto ficará sem nenhuma imagem.');
      }

      setStatus('Atualizando banco de dados...');

      // Atualiza o produto
      const { error } = await supabase
        .from('produtos')
        .update({
          nome,
          descricao,
          preco: parseFloat(preco),
          codigo_referencia: sku,
          categoria_id: categoriaId,
          ativo,
          minio_path: galeriaFinal.length > 0 ? galeriaFinal[0] : null, // Primeira foto fica como capa
          galeria: galeriaFinal
        })
        .eq('id', produtoId);

      if (error) throw error;

      alert('Produto atualizado com sucesso!');
      router.push('/admin/produtos/gerenciar');

    } catch (error) {
        if (error instanceof Error) {
          setStatus(`Erro ao salvar: ${error.message}`);
        } else {
          setStatus('Erro desconhecido ao salvar.');
        }
        setSalvando(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 relative">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Editar Produto #{produtoId}</h2>
        
        {status && <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">{status}</div>}

        <form onSubmit={handleSalvar} className="space-y-6">
          
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Produto</label>
              <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria</label>
              <select required value={categoriaId || ''} onChange={(e) => setCategoriaId(Number(e.target.value))} className="w-full border p-3 rounded-xl text-gray-800">
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* BLOCO 2: DESCRIÇÃO (Fora do grid, ocupa a largura total) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição do Produto</label>
            <textarea 
              rows={4}
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              className="w-full border p-3 rounded-xl text-gray-800 resize-none outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva os detalhes do produto..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" required value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / Referência</label>
              <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800"/>
            </div>
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
               <select value={ativo ? 'true' : 'false'} onChange={(e) => setAtivo(e.target.value === 'true')} className="w-full border p-3 rounded-xl text-gray-800">
                  <option value="true">Ativo na Loja</option>
                  <option value="false">Oculto</option>
               </select>
            </div>
          </div>

          {/* GESTÃO DE IMAGENS */}
          <div className="p-5 border border-gray-200 rounded-xl bg-gray-50 space-y-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <UploadCloud size={20}/> Galeria de Imagens
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              {/* Fotos Atuais (Vindas do Banco) */}
              {galeriaAtual.map((path, index) => (
                <div key={`atual-${index}`} className="relative group rounded-lg overflow-hidden border border-gray-300 bg-white shadow-sm aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`${MINIO_BASE_URL}/${path}`} alt={`Foto ${index}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => removerDaGaleriaAtual(index)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg">
                      <X size={18} />
                    </button>
                  </div>
                  {index === 0 && <span className="absolute bottom-0 left-0 w-full bg-blue-600/90 text-white text-[10px] font-bold text-center py-1">CAPA</span>}
                </div>
              ))}

              {/* Fotos Novas (Acabaram de ser inseridas) */}
              {imagensNovas.map((file, index) => (
                <div key={`nova-${index}`} className="relative group rounded-lg overflow-hidden border-2 border-green-400 bg-white shadow-sm aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(file)} alt={`Nova ${index}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => removerImagemNova(index)} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg">
                      <X size={18} />
                    </button>
                  </div>
                  <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">NOVA</span>
                </div>
              ))}
            </div>

            {/* Input para adicionar mais fotos */}
            <div className="pt-2">
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                onChange={handleFileChange} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
              />
            </div>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button type="submit" disabled={salvando} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
            <button type="button" onClick={() => router.push('/admin/produtos/gerenciar')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 p-4 rounded-xl font-bold transition-all">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}