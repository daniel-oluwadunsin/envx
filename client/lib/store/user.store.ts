import { User } from "../types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  user?: User;
  accessToken?: string;
}

interface UserActions {
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  clearUser: () => void;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: undefined,
      accessToken: undefined,
      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      clearUser: () => set({ user: undefined, accessToken: undefined }),
    }),
    {
      name: "user-store",
    },
  ),
);
