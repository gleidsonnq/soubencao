"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    // 1. Limpa espaços invisíveis no começo e no final do e-mail
    const emailLimpo = email.trim();

    // Faz a autenticação segura e criptografada com o Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email: emailLimpo,
      password: senha,
    });

    if (error) {
      // 2. Imprime o erro real no console para você debugar e mostra na tela
      console.error("Motivo da recusa do Supabase:", error.message);
      setErro(`Erro do Supabase: ${error.message}`); 
      setCarregando(false);
    } else {
      router.push('/admin/produtos/novo'); 
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-extrabold text-gray-800 mb-2 text-center">Painel Queiroz Auto</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Acesso restrito para administradores</p>

        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-medium">{erro}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
            <input 
              type="password" required value={senha} onChange={(e) => setSenha(e.target.value)}
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
            />
          </div>
          <button 
            type="submit" disabled={carregando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {carregando ? 'Verificando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}