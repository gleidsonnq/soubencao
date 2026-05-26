'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';
import { Menu, X, LogOut, TrendingUp, PackagePlus, FileEdit } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Estado para controlar se o menu mobile está aberto ou fechado
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const linkAtivo = "bg-blue-600 text-white font-semibold shadow-md";
  const linkInativo = "text-gray-300 hover:bg-gray-800 hover:text-white transition-colors";

  // Se for o ecrã de login, devolve apenas o conteúdo sem a barra lateral
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Função auxiliar para fechar o menu ao clicar num link (apenas no mobile)
  const fecharMenu = () => setMenuAberto(false);

  return (
    // Mudamos para flex-col no mobile e flex-row em ecrãs médios (md) ou maiores
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      
      {/* CABEÇALHO MOBILE (Visível apenas em ecrãs pequenos) */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center shadow-md z-20">
        <h2 className="text-xl font-bold tracking-wide">Painel Admin</h2>
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {menuAberto ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* BARRA LATERAL / MENU DROPDOWN */}
      <aside className={`
        ${menuAberto ? 'block' : 'hidden'} 
        md:block w-full md:w-64 bg-gray-900 text-white flex flex-col shadow-xl z-10 md:min-h-screen shrink-0 transition-all
      `}>
        {/* Título oculto no mobile (já aparece no cabeçalho), visível no desktop */}
        <div className="hidden md:block p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold tracking-wide">Painel Admin</h2>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          <Link 
            href="/admin/vendas" 
            onClick={fecharMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/admin/vendas' ? linkAtivo : linkInativo}`}
          >
            <TrendingUp size={20} />
            <span>Acompanhar Vendas</span>
          </Link>

          <Link 
            href="/admin/produtos/novo" 
            onClick={fecharMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/admin/produtos/novo' ? linkAtivo : linkInativo}`}
          >
            <PackagePlus size={20} />
            <span>Incluir Produto</span>
          </Link>

          <Link 
            href="/admin/produtos/gerenciar" 
            onClick={fecharMenu}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === '/admin/produtos/gerenciar' ? linkAtivo : linkInativo}`}
          >
            <FileEdit size={20} />
            <span>Editar / Eliminar</span>
          </Link>
        </nav>

        {/* BOTÃO DESLOGAR */}
        <div className="p-4 border-t border-gray-800 mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Deslogar</span>
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto text-black">
        {children}
      </main>
      
    </div>
  );
}