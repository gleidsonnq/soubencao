import { StoreCard } from '@/components/portal/StoreCard';
import { ShoppingBag, ShoppingCart, Store, Hammer } from 'lucide-react';

export default function PortalSouBencao() {
  const stores = [
    {
      title: 'Benção Store',
      description: 'Camas, Colchões Ortobom e Vestuário',
      href: '/bencaostore',
      Icon: ShoppingBag,
      colorClass: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Super Luzardo',
      description: 'Alimentos e Bebidas',
      href: '/superluzardo',
      Icon: ShoppingCart,
      colorClass: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Super Mucunã',
      description: 'Hortifruti e Mercearia',
      href: '/supermucuna',
      Icon: Store,
      colorClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      title: 'Depósito Benção',
      description: 'Materiais de Construção e Ferramentas',
      href: '/depositobencao',
      Icon: Hammer,
      colorClass: 'bg-orange-600 hover:bg-orange-700',
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-7xl w-full">
        
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Grupo Sou Benção
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
            Escolha um de nossos segmentos abaixo. A qualidade e o atendimento que você já conhece, agora a um clique de distância.
          </p>
        </header>

        {/* Grid ajustado: 1 coluna no celular, 2 no tablet, 4 no desktop */}
        <nav className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stores.map((store) => (
            <StoreCard 
              key={store.href}
              title={store.title}
              description={store.description}
              href={store.href}
              Icon={store.Icon}
              colorClass={store.colorClass}
            />
          ))}
        </nav>

      </div>
    </main>
  );
}