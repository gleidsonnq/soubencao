import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  nome: string;
  preco: number;
  minio_path: string;
  quantidade: number;
  estoque: number;
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
        
        // PROTEÇÃO: se o estoque vier undefined, assume 99 como limite seguro
        const limiteEstoque = newItem.estoque ?? 99; 
        
        if (existingItem) {
          const novaQuantidade = Math.min(existingItem.quantidade + 1, limiteEstoque);
          
          if (novaQuantidade === existingItem.quantidade) {
            alert('Você atingiu o estoque máximo disponível para este produto!');
          }

          return {
            items: state.items.map(item =>
              item.id === newItem.id ? { ...item, quantidade: novaQuantidade } : item
            ),
            isOpen: true
          };
        }
        
        if (limiteEstoque <= 0) {
          alert('Este produto está esgotado!');
          return { items: state.items, isOpen: state.isOpen };
        }

        return { 
          items: [...state.items, { ...newItem, quantidade: 1 }],
          isOpen: true
        };
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),

      updateQuantity: (id, quantidade) => set((state) => {
        let mostrarAlerta = false;

        const novosItems = state.items.map(item => {
          if (item.id === id) {
            // Se o item for "antigo" no cache, usa 99. Se for novo, usa o estoque real.
            const limiteEstoque = item.estoque ?? 99; 
            
            // Se tentou clicar no '+' passando do limite:
            if (quantidade > limiteEstoque) {
              mostrarAlerta = true;
              return { ...item, quantidade: limiteEstoque };
            }
            
            // Se não passou do limite, atualiza normal (garantindo que não seja menor que 1)
            const novaQuantidade = Math.max(1, quantidade);
            return { ...item, quantidade: novaQuantidade };
          }
          return item;
        });

        // Exibe o alerta na tela se tentou ultrapassar
        if (mostrarAlerta) {
          setTimeout(() => alert('Quantidade máxima disponível em estoque atingida!'), 10);
        }

        return { items: novosItems };
      }),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'bencao-store-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);