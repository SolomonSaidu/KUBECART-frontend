import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const sessionStore = {
  getItem(name) {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage.getItem(name);
  },
  setItem(name, value) {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(name, value);
  },
  removeItem(name) {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(name);
  },
};

export const useAdminAuthStore = create(
  persist(
    (set) => ({
      token: null,
      csrfToken: null,
      admin: null,
      setSession({ token, csrfToken, admin }) {
        set({ token, csrfToken: csrfToken || null, admin: admin || null });
      },
      setAdmin(admin) {
        set({ admin });
      },
      clearSession() {
        set({ token: null, csrfToken: null, admin: null });
      },
    }),
    {
      name: "kubecart:admin-session",
      storage: createJSONStorage(() => sessionStore),
      partialize: (state) => ({
        token: state.token,
        csrfToken: state.csrfToken,
        admin: state.admin,
      }),
    }
  )
);
