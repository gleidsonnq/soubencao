export interface Produto {
  id: number;
  codigo_referencia: string;
  loja_id: number;
  categoria_id: number;
  nome: string;
  descricao: string;
  preco: number;
  estoque: number;
  minio_path: string;
  galeria?: string[]; // <-- Nova linha: array de strings opcional
  ativo: boolean;
}