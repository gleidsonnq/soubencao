"use client";

import { useCartStore } from '@/store/cartStore';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CartSidebar() {
  const { items, isOpen, closeCart, removeItem, updateQuantity } = useCartStore();
  const pathname = usePathname();
  const lojaSlug = pathname.split('/')[1] || 'bencaostore';

  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

  return (
    /* 1. Adicionamos o onClick={closeCart} no contêiner pai (fundo escuro).
         Se o usuário clicar no fundo, o carrinho fecha.
         Reduzi a opacidade de bg-black/50 para bg-black/30 para a página ao fundo ficar mais visível.
    */
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-black/30 transition-opacity cursor-pointer"
      onClick={closeCart}
    >
      {/* 2. ATENÇÃO AQUI: Adicionamos o onClick={(e) => e.stopPropagation()} na gaveta branca.
           Isso impede que o clique dentro do carrinho suba para o pai. 
           Sem isso, se você tentasse clicar no "+" ou "-" do produto, o carrinho fecharia sozinho.
           Mudamos o cursor de volta para o padrão (cursor-default).
      */}
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Cabeçalho do Carrinho */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag /> Meu Carrinho
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Lista de Produtos */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg font-medium">Seu carrinho está vazio.</p>
              <p className="text-sm mt-1">Adicione produtos da Benção Store para começar.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 border-b pb-4">
                <div className="w-20 h-20 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  <Image 
                    src={`https://s3.infra-queirozauto.cloud/${item.minio_path}`} 
                    alt={item.nome} 
                    fill 
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">{item.nome}</h3>
                  <p className="text-blue-600 font-bold mt-1">R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center border rounded-md bg-white">
                      <button onClick={() => updateQuantity(item.id, item.quantidade - 1)} className="px-2 py-1 hover:bg-gray-100 font-bold text-gray-600">-</button>
                      <span className="px-3 text-sm font-semibold text-gray-700">{item.quantidade}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantidade + 1)} className="px-2 py-1 hover:bg-gray-100 font-bold text-gray-600">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors" title="Remover item">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé e Checkout */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex justify-between mb-4">
            <span className="font-semibold text-gray-600">Subtotal</span>
            <span className="font-bold text-xl text-gray-900">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          <Link 
              href={`/${lojaSlug}/checkout`} // <-- Agora o link é dinâmico!
              onClick={closeCart}
              className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              Finalizar Compra
            </Link>
        </div>
      </div>
    </div>
  );
}