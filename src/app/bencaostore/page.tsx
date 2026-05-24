import Link from 'next/link';
import { ArrowLeft, PackageX, ShoppingCart } from 'lucide-react';
import { getProdutosPorLoja } from '@/services/productService';
import { ProductCard } from '@/components/ui/ProductCard';
import { CartSidebar } from '@/components/ui/CartSidebar';
import { CartHeaderIcon } from '@/components/ui/CartHeaderIcon';

export const revalidate = 0; 

export default async function BencaoStorePage() {
  const produtos = await getProdutosPorLoja('bencaostore');

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:bg-blue-700 p-2 rounded-full transition-colors" aria-label="Voltar para o Portal">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-3xl font-bold tracking-wide">Benção Store</h1>
          </div>
          
          {/* Este é o botão mágico que abre a aba lateral a qualquer momento */}
          <CartHeaderIcon />
          
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-6">
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Camas, Colchões e Vestuário</h2>
          <p className="text-gray-600">Confira nossas ofertas exclusivas.</p>
        </div>

        {produtos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <PackageX size={64} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum produto cadastrado no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {produtos.map((produto, index) => (
              <ProductCard 
                key={produto.id}
                id={produto.id}
                nome={produto.nome}
                preco={produto.preco}
                minioPath={produto.minio_path}
                priority={index < 4}
              />
            ))}
          </div>
        )}
      </main>

      {/* A gaveta do carrinho inserida aqui! */}
      <CartSidebar />
    </div>
  );
}