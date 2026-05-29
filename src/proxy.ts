import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Conecta ao Supabase em nível de servidor/middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
            response.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Verifica se existe uma sessão criptografada ativa do usuário
  const { data: { session } } = await supabase.auth.getSession();

  const url = request.nextUrl.clone();

  // Se tentar acessar qualquer página do admin (exceto login) e NÃO estiver logado: redireciona
  if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login')) {
    if (!session) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

// Configura o middleware para rodar APENAS nas rotas do painel admin
export const config = {
  matcher: ['/admin/:path*'],
};