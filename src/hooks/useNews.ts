import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../api/client';
import { useSocket } from '../context/SocketContext';

export type UnifiedNewsItem = {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string | null;
  author: string;
  authorAvatar?: string;
  source: string;
  sourceLabel: string;
  sourceColor: string;
  publishedAt: string;
  score?: number;
  comments?: number;
  tags: string[];
  readTime?: string;
};

export function useNews() {
  const [articles, setArticles] = useState<UnifiedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [breakingNews, setBreakingNews] = useState<{ article: UnifiedNewsItem, keyword: string } | null>(null);
  const [newArticlesCount, setNewArticlesCount] = useState(0);

  const { socket } = useSocket();

  const fetchNews = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = forceRefresh ? '/api/news/refresh' : '/api/news';
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
      if (!res.ok) throw new Error('Failed to fetch news');
      const data = await res.json();
      setArticles(data);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || 'Unable to load news right now');
    } finally {
      setLoading(false);
      setNewArticlesCount(0); // clear badge on explicit fetch
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Setup Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleFeedUpdated = (newArticles: UnifiedNewsItem[]) => {
      setArticles(prev => {
        const unique = newArticles.filter(n => !prev.find(p => p.id === n.id));
        if (unique.length > 0) {
          setNewArticlesCount(count => count + unique.length);
          setLastUpdated(new Date());
          return [...unique, ...prev]; // prepend new
        }
        return prev;
      });
    };

    const handleBreakingNews = (data: { article: UnifiedNewsItem, keyword: string }) => {
      setBreakingNews(data);
    };

    socket.on('NEWS_FEED_UPDATED', handleFeedUpdated);
    socket.on('NEWS_BREAKING', handleBreakingNews);

    return () => {
      socket.off('NEWS_FEED_UPDATED', handleFeedUpdated);
      socket.off('NEWS_BREAKING', handleBreakingNews);
    };
  }, [socket]);

  return {
    articles,
    loading,
    error,
    lastUpdated,
    refresh: () => fetchNews(true),
    breakingNews,
    dismissBreakingNews: () => setBreakingNews(null),
    newArticlesCount,
    clearNewBadge: () => setNewArticlesCount(0)
  };
}
