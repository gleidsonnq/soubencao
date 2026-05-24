import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function SuperLuzardoPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-green-600 text-white p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Link href="/" className="hover:bg-green-700 p-2 rounded-full transition-colors" aria-label="Voltar para o Portal">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold tracking-wide">Super Luzardo</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 mt-8">
        <div className="mb-8 border-b pb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Alimentos e Bebidas</h2>
          <p className="text-gray-600">Qualidade e frescor para a sua mesa.</p>
        </div>
      </main>
    </div>
  );
}