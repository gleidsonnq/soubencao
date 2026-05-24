"use client";

import Image from 'next/image';
import Link from 'next/link'; // <-- Adicione esta importação
import { useCartStore } from '@/store/cartStore';

interface ProductCardProps {
  id: number;
  nome: string;
  preco: number;
  minioPath: string;
  priority?: boolean;
}

export function ProductCard({ id, nome, preco, minioPath, priority = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const imageUrl = `https://s3.infra-queirozauto.cloud/${minioPath}`;

  return (
    <div className="border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 bg-white flex flex-col h-full group">
      
      {/* Envolvemos a imagem e o título em um Link para a página de detalhes */}
      <Link href={`/bencaostore/produto/${id}`} className="flex flex-col flex-grow cursor-pointer">
        <div className="w-full h-48 relative mb-4 rounded-lg overflow-hidden bg-gray-50">
          {minioPath ? (
            <Image 
              src={imageUrl} 
              alt={nome} 
              fill 
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-gray-300 text-sm">
              Sem Imagem
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-gray-800 line-clamp-2 flex-grow group-hover:text-blue-600 transition-colors" title={nome}>
          {nome}
        </h3>
      </Link>
      
      <div className="mt-4 pt-4 border-t border-gray-50">
        <p className="text-2xl font-extrabold text-blue-600">
          R$ {preco.toFixed(2).replace('.', ',')}
        </p>
        <button 
          onClick={() => addItem({ id, nome, preco, minio_path: minioPath })}
          className="mt-3 w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium active:scale-95"
        >
          Adicionar ao Carrinho
        </button>
      </div>
    </div>
  );
}