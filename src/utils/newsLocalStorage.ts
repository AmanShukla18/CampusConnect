import { storage } from './storage';
import { UnifiedNewsItem } from '../hooks/useLiveNews';

const CACHE_KEY = "techNews_liveCache";
const BOOKMARKS_KEY = "techNews_bookmarks";
const READ_HISTORY_KEY = "techNews_readHistory";
const SEEN_NEW_KEY = "techNews_seenNew";

export const getLocalCache = async (): Promise<{ articles: UnifiedNewsItem[], savedAt: number } | null> => {
  const data = await storage.getItem(CACHE_KEY);
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
};

export const saveLocalCache = async (articles: UnifiedNewsItem[]) => {
  const slice = articles.slice(0, 50);
  await storage.setItem(CACHE_KEY, JSON.stringify({ articles: slice, savedAt: Date.now() }));
};

export const getBookmarks = async (): Promise<UnifiedNewsItem[]> => {
  const data = await storage.getItem(BOOKMARKS_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
};

export const toggleBookmark = async (article: UnifiedNewsItem): Promise<UnifiedNewsItem[]> => {
  const bookmarks = await getBookmarks();
  const exists = bookmarks.find(b => b.id === article.id);
  const updated = exists ? bookmarks.filter(b => b.id !== article.id) : [article, ...bookmarks];
  await storage.setItem(BOOKMARKS_KEY, JSON.stringify(updated.slice(0, 100)));
  return updated;
};

export const clearBookmarks = async () => {
  await storage.removeItem(BOOKMARKS_KEY);
};

export const markAsRead = async (id: string) => {
  const data = await storage.getItem(READ_HISTORY_KEY);
  let history: string[] = data ? JSON.parse(data) : [];
  if (!history.includes(id)) {
    history.unshift(id);
    await storage.setItem(READ_HISTORY_KEY, JSON.stringify(history.slice(0, 500)));
  }
};

export const getReadHistory = async (): Promise<string[]> => {
  const data = await storage.getItem(READ_HISTORY_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
};

export const markNewsAsSeen = async (ids: string[]) => {
  const data = await storage.getItem(SEEN_NEW_KEY);
  let seen: string[] = data ? JSON.parse(data) : [];
  seen = [...new Set([...seen, ...ids])];
  await storage.setItem(SEEN_NEW_KEY, JSON.stringify(seen.slice(0, 1000)));
};

export const getSeenNewsIds = async (): Promise<string[]> => {
  const data = await storage.getItem(SEEN_NEW_KEY);
  if (!data) return [];
  try { return JSON.parse(data); } catch { return []; }
};
