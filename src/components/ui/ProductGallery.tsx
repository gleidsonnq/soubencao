"use client";

import Image from 'next/image';
import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';

interface ProductGalleryProps {
  nome: string;
  imagens: string[];
}

export function ProductGallery({ nome, imagens }: ProductGalleryProps) {
  const imagensValidas = imagens && imagens.length > 0 ? imagens : [];

  if (imagensValidas.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 rounded-xl min-h-[400px]">
        Sem Imagem
      </div>
    );
  }

  return <ProductGalleryContent nome={nome} imagens={imagensValidas} />;
}

function ProductGalleryContent({ nome, imagens }: { nome: string; imagens: string[] }) {
  const [imagemPrincipal, setImagemPrincipal] = useState(imagens[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full flex flex-col gap-4">
        {/* Imagem Principal em Destaque */}
        <div 
          className="w-full relative aspect-square bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm cursor-zoom-in group"
          onClick={() => setIsModalOpen(true)}
        >
          <Image
            src={`https://s3.infra-queirozauto.cloud/${imagemPrincipal}`}
            alt={nome}
            fill
            priority
            className="object-contain p-4 transition-opacity duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Ícone de lupa que aparece ao passar o mouse */}
          <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded-full text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <ZoomIn size={24} />
          </div>
        </div>

        {/* Grid de Miniaturas (Thumbnails) */}
        {imagens.length > 1 && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {imagens.map((img, index) => (
              <button
                key={index}
                onClick={() => setImagemPrincipal(img)}
                className={`relative w-24 h-24 flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                  imagemPrincipal === img 
                    ? 'border-blue-600 shadow-md ring-2 ring-blue-100'
                    : 'border-gray-200 opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={`https://s3.infra-queirozauto.cloud/${img}`}
                  alt={`${nome} - Vista ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover p-1"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Tela Cheia (Lightbox) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 md:p-12 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setIsModalOpen(false)} // Fecha se clicar no fundo escuro
        >
          {/* Botão de Fechar */}
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-[101] bg-black/50 p-2 rounded-full"
            onClick={() => setIsModalOpen(false)}
          >
            <X size={32} />
          </button>

          {/* Container da Imagem Ampliada */}
          <div 
            className="relative w-full max-w-5xl aspect-square md:aspect-video cursor-default"
            onClick={(e) => e.stopPropagation()} // Impede que o clique na foto feche o modal
          >
            <Image
              src={`https://s3.infra-queirozauto.cloud/${imagemPrincipal}`}
              alt={nome}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}