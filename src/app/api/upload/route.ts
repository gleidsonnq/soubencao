import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";

// Instancia o cliente apontando para o seu MinIO na VPS
const s3 = new S3Client({
  region: "us-east-1", 
  endpoint: process.env.MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // OBRIGATÓRIO para o MinIO
});

export async function POST(request: Request) {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const path = formData.get('path') as string; // Recebe "bencaostore/vestuarios/foto.png"
  
      if (!file || !path) {
        return NextResponse.json({ erro: 'Arquivo ou caminho ausente' }, { status: 400 });
      }
  
      const buffer = Buffer.from(await file.arrayBuffer());
  
      // 1. SEPARA O NOME DO BUCKET DO RESTO DO CAMINHO
      const partes = path.split('/');
      const bucketName = partes[0]; // Pega exatamente "bencaostore"
      const chaveMinio = partes.slice(1).join('/'); // Fica "vestuarios/foto.png"
  
      // 2. ENVIA PARA O MINIO
      const command = new PutObjectCommand({
        Bucket: bucketName, // Usa o nome "bencaostore" dinamicamente
        Key: chaveMinio,    // Salva dentro das pastas da categoria
        Body: buffer,
        ContentType: file.type,
      });
  
      await s3.send(command);
  
      return NextResponse.json({ sucesso: true });
    } catch (error) {
      console.error("Erro no MinIO:", error);
      return NextResponse.json({ erro: 'Falha no upload' }, { status: 500 });
    }
  }