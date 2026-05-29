import Link from 'next/link';
import { Home } from 'lucide-react';
import { getProdutosPorLoja } from '@/services/productService';
import { CartSidebar } from '@/components/ui/CartSidebar';
import { CartHeaderIcon } from '@/components/ui/CartHeaderIcon';
import { StoreCatalog } from '@/components/ui/StoreCatalog'; // Importamos o novo componente!

export const revalidate = 0; 

export default async function BencaoStorePage() {
  const produtos = await getProdutosPorLoja('bencaostore');

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <header className="bg-blue-600 text-white p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/bencaostore" className="hover:bg-blue-700 p-2 rounded-full transition-colors" aria-label="Voltar para o Portal">
              <Home size={24} />
            </Link>
            <h1 className="text-3xl font-bold tracking-wide">Benção Store</h1>
          </div>
          
          <CartHeaderIcon />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-6">
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Camas, Colchões e Vestuário</h2>
          <p className="text-gray-600">Confira nossas ofertas exclusivas. Utilize os filtros abaixo para encontrar o que procura.</p>
        </div>

        {/* Aqui nós inserimos o Catálogo Inteligente, passando os produtos do banco para ele */}
        <StoreCatalog produtos={produtos} />
        
      </main>

      <CartSidebar />
    </div>
  );
}