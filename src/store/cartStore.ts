import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // <-- IMPORTANTE: Importa o middleware de persistência

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  minio_path: string;
  quantidade: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantidade'>) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantidade: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      
      addItem: (newItem) => set((state) => {
        const existingItem = state.items.find(item => item.id === newItem.id);
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.id === newItem.id ? { ...item, quantidade: item.quantidade + 1 } : item
            ),
            isOpen: true
          };
        }
        return { 
          items: [...state.items, { ...newItem, ...{ quantidade: 1 } }],
          isOpen: true
        };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      updateQuantity: (id, quantidade) => set((state) => ({
        items: state.items.map(item =>
          item.id === id ? { ...item, quantidade: Math.max(1, quantidade) } : item
        )
      })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'bencao-store-cart', // Nome único da chave que será criada no LocalStorage do navegador
      partialize: (state) => ({ items: state.items }), // Salva APENAS os itens, ignorando o estado "isOpen"
    }
  )
);