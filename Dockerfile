# Usa uma versão LTS e leve do Node.js
FROM node:20-alpine AS base

# Fase 1: Instalação de Dependências
FROM base AS deps
# Pacote necessário para compatibilidade de algumas bibliotecas no Alpine Linux
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# npm ci é mais seguro e rápido que npm install para ambientes de produção
RUN npm ci

# Fase 2: Construção (Build)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Desabilita a telemetria do Next.js (privacidade dos seus dados)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Fase 3: Produção (Runner) - Imagem final super enxuta
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Cibersegurança: Cria um usuário restrito para rodar a aplicação
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia os arquivos públicos (imagens estáticas, favicons)
COPY --from=builder /app/public ./public

# Configura permissões corretas para o cache do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copia apenas o resultado do build standalone (arquivos estritamente necessários)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Alterna para o usuário seguro
USER nextjs

# Expõe a porta que o Traefik vai ler
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# O server.js é gerado automaticamente pelo Next.js no modo standalone
CMD ["node", "server.js"]