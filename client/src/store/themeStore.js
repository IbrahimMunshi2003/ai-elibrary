import { create } from 'zustand';

// Theme store kept for backwards compatibility but forced to light mode
export const useThemeStore = create((set) => ({
  isDarkMode: false,
  toggleDarkMode: () => {},
  initTheme: () => {
    document.documentElement.classList.remove('dark');
  }
}));
