"use client";

import { useCartStore } from '@/store/cartStore';

interface AddToCartButtonProps {
  produto: {
    id: number;
    nome: string;
    preco: number;
    minio_path: string;
    estoque: number;
  };
}

export function AddToCartButton({ produto }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button 
      onClick={() => addItem({id: produto.id, nome: produto.nome, preco: produto.preco, minio_path: produto.minio_path, estoque: produto.estoque})}
      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-md active:scale-[0.99]"
    >
      Adicionar ao Carrinho
    </button>
  );
}