import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useBookmarkStore = create(
  persist(
    (set, get) => ({
      bookmarks: [],
      
      addBookmark: (book) => {
        const currentBookmarks = get().bookmarks;
        if (!currentBookmarks.find(b => b.id === book.id)) {
          set({ bookmarks: [...currentBookmarks, book] });
        }
      },
      
      removeBookmark: (bookId) => {
        set({ bookmarks: get().bookmarks.filter(b => b.id !== bookId) });
      },
      
      isBookmarked: (bookId) => {
        return get().bookmarks.some(b => b.id === bookId);
      },

      clearBookmarks: () => set({ bookmarks: [] }),
    }),
    {
      name: 'bookmark-storage',
    }
  )
);
