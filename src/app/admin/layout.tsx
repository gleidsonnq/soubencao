'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const linkAtivo = "bg-blue-600 text-white font-semibold";
  const linkInativo = "text-gray-300 hover:bg-gray-800 hover:text-white transition-colors";

  // Se for o ecrã de login, devolve apenas o conteúdo sem a barra lateral
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      
      {/* BARRA LATERAL (Sidebar) */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold">Painel Admin</h2>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link 
            href="/admin/vendas" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname === '/admin/vendas' ? linkAtivo : linkInativo}`}
          >
            <span>📊</span> Acompanhar Vendas
          </Link>

          <Link 
            href="/admin/produtos/novo" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname === '/admin/produtos/novo' ? linkAtivo : linkInativo}`}
          >
            <span>➕</span> Incluir Produto
          </Link>

          <Link 
            href="/admin/produtos/gerenciar" 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg ${pathname === '/admin/produtos/gerenciar' ? linkAtivo : linkInativo}`}
          >
            <span>✏️</span> Editar / Eliminar
          </Link>
        </nav>

        {/* BOTÃO DESLOGAR */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-gray-800 hover:text-red-300 rounded-lg transition-colors"
          >
            <span>🚪</span> Deslogar
          </button>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto text-black">
        {children}
      </main>
      
    </div>
  );
}