import { createClient } from '@supabase/supabase-js';

// Capturamos as variáveis de ambiente de forma segura
// A exclamação (!) diz ao TypeScript que temos certeza de que essas variáveis existem no .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro Crítico: Variáveis de ambiente do Supabase não encontradas.");
}

// Cria e exporta uma única instância do cliente para ser usada em todo o projeto
export const supabase = createClient(supabaseUrl, supabaseAnonKey);