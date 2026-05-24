import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prepara o projeto para rodar leve no Docker da sua VPS
  output: "standalone",
  
  // Libera o acesso às imagens do seu MinIO
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.infra-queirozauto.cloud",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "minio.infra-queirozauto.cloud",
        port: "",
        pathname: "/**",
      },
    ],
  },
  
  // Cabeçalhos de segurança (Cibersegurança)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;