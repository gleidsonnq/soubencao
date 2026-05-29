import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, PackageX, CheckCircle } from 'lucide-react';
import { getProdutoPorId } from '@/services/productService';
import { AddToCartButton } from '@/components/ui/AddToCartButton';
import { CartHeaderIcon } from '@/components/ui/CartHeaderIcon';
import { CartSidebar } from '@/components/ui/CartSidebar';
import { ProductGallery } from '@/components/ui/ProductGallery';

export const revalidate = 0;

// No Next.js 15, os parâmetros da URL chegam como uma Promise
export default async function ProdutoDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvido = await params;
  const produto = await getProdutoPorId(Number(resolvido.id));

  if (!produto) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <PackageX size={64} className="text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">Produto não encontrado</h1>
        <Link href="/bencaostore" className="mt-4 text-blue-600 hover:underline">Voltar para a loja</Link>
      </div>
    );
  }

  const imageUrl = `https://s3.infra-queirozauto.cloud/${produto.minio_path}`;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/bencaostore" className="hover:bg-blue-700 p-2 rounded-full transition-colors">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold tracking-wide">Benção Store</h1>
          </div>
          <CartHeaderIcon />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          {/* Coluna da Imagem */}
         {/* Coluna da Galeria de Imagens */}
         <div className="w-full md:w-1/2 p-6 md:p-8 bg-gray-50 flex flex-col justify-start">
            <ProductGallery 
              nome={produto.nome} 
              // Se o produto tiver galeria no banco, usa ela. Senão, cria um array improvisado com o minio_path
              imagens={produto.galeria && produto.galeria.length > 0 ? produto.galeria : [produto.minio_path]} 
            />
          </div>

          {/* Coluna dos Detalhes */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <div className="mb-2 flex items-center gap-2 text-sm text-green-600 font-semibold bg-green-50 w-fit px-3 py-1 rounded-full">
              <CheckCircle size={16} /> Em Estoque ({produto.estoque} disponíveis)
            </div>
            
            <p className="text-sm text-gray-400 mb-2 uppercase tracking-widest">SKU: {produto.codigo_referencia}</p>
            <h2 className="text-4xl font-bold text-gray-800 mb-6">{produto.nome}</h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              {produto.descricao || "Nenhuma descrição disponível para este produto."}
            </p>

            <div className="mt-auto pt-8 border-t border-gray-100">
              <p className="text-4xl font-extrabold text-blue-600 mb-6">
                R$ {produto.preco.toFixed(2).replace('.', ',')}
              </p>
              
              {/* O nosso componente isolado agindo aqui */}
              <AddToCartButton 
                produto={{
                  id: produto.id,
                  nome: produto.nome,
                  preco: produto.preco,
                  minio_path: produto.minio_path,
                  estoque: produto.estoque
                }} 
              />
            </div>
          </div>

        </div>
      </main>

      <CartSidebar />
    </div>
  );
}