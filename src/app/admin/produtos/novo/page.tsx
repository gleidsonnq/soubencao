"use client";

import { useState, useEffect } from 'react';
import { resizeAndConvertToPNG } from '@/utils/imageProcessor';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, X } from 'lucide-react'; // Ícones para o botão e fechar modal

// Função utilitária para transformar "Colchões Ortobom" em "colchoes-ortobom"
function gerarSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/[^\w-]+/g, '') // Remove caracteres especiais
    .replace(/--+/g, '-');
}

interface Loja {
  id: number;
  nome: string;
  slug: string;
}

interface Categoria {
  id: number;
  nome: string;
  slug: string;
}

export default function NovoProdutoPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Estados do formulário de produto
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [sku, setSku] = useState('');
  const [status, setStatus] = useState('');
  
  // ESTADO ATUALIZADO: Agora guarda um Array de imagens
  const [imagensProcessadas, setImagensProcessadas] = useState<File[]>([]);
  
  // Estados de controle de Lojas e Categorias
  const [lojaId, setLojaId] = useState<number | null>(null);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [lojasDisponiveis, setLojasDisponiveis] = useState<Loja[]>([]);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Categoria[]>([]);
  const [carregandoPerfil, setCarregandoPerfil] = useState(true);

  // Estados para o Modal de Nova Categoria
  const [mostrarModalCategoria, setMostrarModalCategoria] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [statusCategoria, setStatusCategoria] = useState('');

  // 1. Carrega o perfil do administrador logado
  useEffect(() => {
    async function carregarPerfilAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: perfil } = await supabase
          .from('admin_perfis')
          .select('loja_id, is_superadmin')
          .eq('id', user.id)
          .single();

        if (perfil) {
          setIsSuperAdmin(perfil.is_superadmin);
          
          if (perfil.is_superadmin) {
            const { data: lojas } = await supabase.from('lojas').select('id, nome, slug').order('id');
            if (lojas) {
              setLojasDisponiveis(lojas);
              setLojaId(lojas[0].id);
            }
          } else {
            setLojaId(perfil.loja_id);
          }
        }
      }
      setCarregandoPerfil(false);
    }
    carregarPerfilAdmin();
  }, [supabase]);

  // 2. Sempre que a Loja mudar, busca as Categorias específicas daquela loja
  useEffect(() => {
    async function carregarCategorias() {
      if (!lojaId) return;

      const { data: categorias } = await supabase
        .from('categorias')
        .select('id, nome, slug')
        .eq('loja_id', lojaId)
        .order('nome');

      if (categorias) {
        setCategoriasDisponiveis(categorias);
        if (categorias.length > 0) {
          setCategoriaId(categorias[0].id);
        } else {
          setCategoriaId(null);
        }
      }
    }
    carregarCategorias();
  }, [lojaId, supabase]);

  // FUNÇÃO ATUALIZADA: Processa múltiplas imagens em paralelo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setStatus(`Processando ${e.target.files.length} imagem(ns)...`);
        
        const filesArray = Array.from(e.target.files);
        const filesProntos = await Promise.all(
          filesArray.map(file => resizeAndConvertToPNG(file))
        );
        
        setImagensProcessadas(filesProntos);
        setStatus(`${filesProntos.length} imagem(ns) tratada(s) com sucesso!`);
      } catch (err) {
        if (err instanceof Error) {
          setStatus(`Erro ao processar as imagens: ${err.message}`);
        } else {
          setStatus('Erro desconhecido ao processar as imagens.');
        }
      }
    }
  };

  // 3. Salvar Nova Categoria de forma dinâmica
  const handleCriarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoriaNome.trim() || !lojaId) return;

    setStatusCategoria('Criando...');
    const slugCat = gerarSlug(novaCategoriaNome);

    const { data, error } = await supabase
      .from('categorias')
      .insert([{ 
        loja_id: lojaId, 
        nome: novaCategoriaNome.trim(), 
        slug: slugCat 
      }])
      .select()
      .single();

    if (error) {
      setStatusCategoria(`Erro: ${error.message}`);
    } else if (data) {
      const novaCat: Categoria = { id: data.id, nome: data.nome, slug: data.slug };
      setCategoriasDisponiveis(prev => [...prev, novaCat].sort((a,b) => a.nome.localeCompare(b.nome)));
      setCategoriaId(data.id);
      
      setNovaCategoriaNome('');
      setStatusCategoria('');
      setMostrarModalCategoria(false);
    }
  };

  // FUNÇÃO ATUALIZADA: Envia para o MinIO e depois salva no banco
  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imagensProcessadas.length === 0 || !lojaId || !categoriaId) {
      alert('Preencha todos os campos e certifique-se de adicionar pelo menos uma imagem.');
      return;
    }

    setStatus(`Enviando ${imagensProcessadas.length} imagem(ns) para o servidor...`);
    
    const lojaAtual = lojasDisponiveis.find(l => l.id === lojaId);
    const categoriaAtual = categoriasDisponiveis.find(c => c.id === categoriaId);
    
    const pastaLoja = lojaAtual ? lojaAtual.slug : 'loja';
    const pastaCategoria = categoriaAtual ? categoriaAtual.slug : 'geral';

    try {
      // 1. Upload em paralelo de todas as fotos para o MinIO
      const caminhosSalvos = await Promise.all(
        imagensProcessadas.map(async (img, index) => {
          const minioPathFinal = `${pastaLoja}/${pastaCategoria}/${Date.now()}-${index}-${img.name}`; 
          
          const formData = new FormData();
          formData.append('file', img);
          formData.append('path', minioPathFinal);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Falha no upload de uma das imagens para o MinIO.');

          // O front-end já sabe o caminho, então basta retorná-lo direto!
          return minioPathFinal;
        })
      );

      setStatus('Imagens salvas! Registrando produto no banco de dados...');

      // 2. Grava no banco usando os caminhos retornados
      const { error } = await supabase
        .from('produtos')
        .insert([{ 
          nome,
          descricao, 
          preco: parseFloat(preco), 
          codigo_referencia: sku, 
          minio_path: caminhosSalvos[0], // Primeira foto como capa
          galeria: caminhosSalvos,       // Array completo na coluna galeria
          loja_id: lojaId,
          categoria_id: categoriaId, 
          estoque: 10,
          ativo: true
        }]);

      if (error) {
        setStatus(`Erro ao salvar no banco: ${error.message}`);
      } else {
        setStatus('Produto cadastrado com sucesso! 🎉');
        // Limpa os campos após o sucesso
        setNome(''); 
        setDescricao('');
        setPreco(''); 
        setSku(''); 
        setImagensProcessadas([]);
      }

    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Erro no processo: ${error.message}`);
      } else {
        setStatus('Erro desconhecido no processo.');
      }
    }
  };

  if (carregandoPerfil) return <div className="p-6 text-center font-bold text-gray-500">Verificando acesso...</div>;
  if (!lojaId && !isSuperAdmin) return <div className="p-6 text-center font-bold text-red-500">Acesso negado. Nenhuma loja vinculada.</div>;

  return (
    <div className="min-h-screen bg-slate-100 p-6 relative">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Inclusão de Produto</h2>
        
        {status && <div className="mb-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">{status}</div>}

        <form onSubmit={handleSalvarProduto} className="space-y-5">
          {/* PAINEL GLOBAL DO SUPER ADMIN */}
          {isSuperAdmin && (
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mb-4">
              <label className="block text-sm font-bold text-yellow-800 mb-2">Painel Global: Escolha a Loja de Destino</label>
              <select 
                value={lojaId || ''} 
                onChange={(e) => setLojaId(Number(e.target.value))}
                className="w-full border-yellow-300 p-3 rounded-lg bg-white text-gray-800 focus:ring-yellow-500"
              >
                {lojasDisponiveis.map(loja => (
                  <option key={loja.id} value={loja.id}>{loja.nome}</option>
                ))}
              </select>
            </div>
          )}

          {/* CAIXA DE SELEÇÃO DE CATEGORIAS + BOTÃO ADICIONAR */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoria do Produto</label>
            <div className="flex gap-2">
              <select
                required
                value={categoriaId || ''}
                onChange={(e) => setCategoriaId(Number(e.target.value))}
                className="flex-grow border p-3 rounded-xl bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {categoriasDisponiveis.length === 0 ? (
                  <option value="">Nenhuma categoria cadastrada nesta loja</option>
                ) : (
                  categoriasDisponiveis.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))
                )}
              </select>
              
              <button
                type="button"
                onClick={() => setMostrarModalCategoria(true)}
                className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 rounded-xl font-bold border border-blue-200 transition-colors flex items-center gap-1"
                title="Criar nova categoria"
              >
                <Plus size={18} /> <span className="text-xs">Nova Categoria</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Produto</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Descrição do Produto</label>
            <textarea 
              rows={4}
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              className="w-full border p-3 rounded-xl text-gray-800 resize-none outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descreva os detalhes, material, medidas..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Preço (R$)</label>
              <input type="number" step="0.01" required value={preco} onChange={(e) => setPreco(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800"/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU / Referência</label>
              <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border p-3 rounded-xl text-gray-800"/>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Imagens (Selecione uma ou mais fotos)</label>
            {/* ATRIBUTO MULTIPLE ADICIONADO ABAIXO */}
            <input 
              type="file" 
              accept="image/*" 
              required 
              multiple 
              onChange={handleFileChange} 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 file:cursor-pointer"
            />
          </div>

          <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold transition-all">
            Cadastrar Produto
          </button>
        </form>
      </div>

      {/* MODAL FLUTUANTE PARA CADASTRO DE CATEGORIA */}
      {mostrarModalCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 relative">
            <button 
              onClick={() => setMostrarModalCategoria(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <h3 className="text-lg window-title font-bold text-gray-800 mb-2">Criar Nova Categoria</h3>
            <p className="text-xs text-gray-400 mb-4">Ela será vinculada automaticamente à loja selecionada.</p>

            {statusCategoria && <div className="mb-3 p-2 bg-yellow-50 text-yellow-700 text-xs rounded font-medium">{statusCategoria}</div>}

            <form onSubmit={handleCriarCategoria} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  required 
                  placeholder="Ex: Travesseiros, Alimentos..."
                  value={novaCategoriaNome} 
                  onChange={(e) => setNovaCategoriaNome(e.target.value)} 
                  className="w-full border p-3 rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-bold text-sm transition-all">
                Salvar Categoria
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}