"use client";

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';

export function CartHeaderIcon() {
  const { openCart, items } = useCartStore();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Envolver o setState num setTimeout (mesmo de 0ms) tira a função do fluxo síncrono.
    // O React entende que isso será resolvido no próximo ciclo do Event Loop do navegador, eliminando o erro.
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    // Limpeza de segurança caso o componente seja desmontado antes do timer rodar
    return () => clearTimeout(timer);
  }, []);

  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);

  return (
    <button 
      onClick={openCart}
      className="relative p-2 hover:bg-blue-700 rounded-full transition-colors"
      aria-label="Abrir carrinho"
    >
      <ShoppingCart size={28} />
      
      {/* A bolinha vermelha só renderiza se o componente já estiver montado e houver itens */}
      {mounted && totalItems > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-md animate-in zoom-in duration-200">
          {totalItems}
        </span>
      )}
    </button>
  );
}