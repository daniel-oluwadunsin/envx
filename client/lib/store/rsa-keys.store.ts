import { create } from "zustand";

type RSAKeys = {
  publicKey: string;
  privateKey: string;
};

interface RSAKeysState {
  keys?: RSAKeys[];
}

interface RSAKeysActions {
  setKey: (keys: RSAKeys) => void;
  removeKeyWithPublicKey: (publicKey: string) => void;
  removeKeyWithPrivateKey: (privateKey: string) => void;
  clearKeys: () => void;
}

type RSAKeysStore = RSAKeysState & RSAKeysActions;

export const useRSAKeysStore = create<RSAKeysStore>()((set) => ({
  keys: undefined,
  setKey: (keys) =>
    set((state) => ({
      keys: state.keys ? [...state.keys, keys] : [keys],
    })),
  removeKeyWithPublicKey: (publicKey) =>
    set((state) => ({
      keys: state.keys?.filter((key) => key.publicKey !== publicKey),
    })),
  removeKeyWithPrivateKey: (privateKey) =>
    set((state) => ({
      keys: state.keys?.filter((key) => key.privateKey !== privateKey),
    })),
  clearKeys: () => set({ keys: undefined }),
}));
