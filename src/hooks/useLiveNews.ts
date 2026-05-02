import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { API_BASE_URL } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { getLocalCache, saveLocalCache, markNewsAsSeen as markSeenInStorage } from '../utils/newsLocalStorage';

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
  isNew?: boolean;
};

export function useLiveNews() {
  const [articles, setArticles] = useState<UnifiedNewsItem[]>([]);
  const [newArticles, setNewArticles] = useState<UnifiedNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);
  const [stats, setStats] = useState<{ totalLive?: number; totalArchive?: number }>({});
  const [breakingNews, setBreakingNews] = useState<{ article: UnifiedNewsItem, keyword: string } | null>(null);
  const [sourcesActive, setSourcesActive] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  const { socket } = useSocket();

  const fetchLiveNews = useCallback(async () => {
    try {
      // Check network state via NetInfo (React Native safe)
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        setIsOffline(true);
        setLoading(false);
        return;
      }
      setIsOffline(false);
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/api/news/live`);
      if (res.ok) {
        const data = await res.json();
        const initArticles = (data.articles || []).map((a: any) => ({ ...a, isNew: false }));
        setArticles(initArticles);
        await saveLocalCache(initArticles);
        if (data.lastRefreshed) setLastRefreshed(data.lastRefreshed);
        setNextRefreshIn(data.nextRefreshIn ?? 60);
      }

      const statRes = await fetch(`${API_BASE_URL}/api/news/live/stats`);
      if (statRes.ok) {
        const statData = await statRes.json();
        setStats({ totalLive: statData.totalLive, totalArchive: statData.totalArchive });
      }
    } catch (err) {
      console.error('Fetch live news error', err);
      // Fall back to local cache
      const cache = await getLocalCache();
      if (cache && cache.articles.length > 0) {
        setArticles(cache.articles);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetch(`${API_BASE_URL}/api/news/refresh`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, []);

  useEffect(() => {
    // Load cache immediately for instant display
    getLocalCache().then(cache => {
      if (cache && cache.articles.length > 0) {
        setArticles(cache.articles);
        setLoading(false);
      }
    });

    fetchLiveNews();

    // React Native safe network monitoring via NetInfo
    const unsubscribe = NetInfo.addEventListener((state: any) => {
      if (state.isConnected) {
        setIsOffline(false);
        fetchLiveNews();
      } else {
        setIsOffline(true);
      }
    });

    return () => unsubscribe();
  }, [fetchLiveNews]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleFeedUpdated = (data: any) => {
      const { newArticles: freshlyArrived, totalNew, fetchedAt, sources } = data;
      if (sources) setSourcesActive(sources);
      if (fetchedAt) setLastRefreshed(fetchedAt);

      if (totalNew > 0 && freshlyArrived?.length > 0) {
        const markedNew = freshlyArrived.map((a: any) => ({ ...a, isNew: true }));
        setNewArticles(prev => [...markedNew, ...prev]);
        setArticles(prev => {
          const unique = markedNew.filter((n: any) => !prev.find((p: any) => p.id === n.id));
          const updated = [...unique, ...prev];
          saveLocalCache(updated);
          return updated;
        });
      }
    };

    const handleBreakingNews = (data: { article: UnifiedNewsItem, keyword: string }) => {
      setBreakingNews(data);
    };

    const handleCountdown = (data: { secondsUntilRefresh: number, lastRefreshed: string }) => {
      setNextRefreshIn(data.secondsUntilRefresh);
      setRefreshing(data.secondsUntilRefresh === 0);
    };

    const handleStats = (data: any) => {
      setStats(prev => ({ ...prev, ...data }));
    };

    socket.on('NEWS_FEED_UPDATED', handleFeedUpdated);
    socket.on('NEWS_BREAKING', handleBreakingNews);
    socket.on('NEWS_REFRESH_COUNTDOWN', handleCountdown);
    socket.on('NEWS_STATS_UPDATE', handleStats);

    return () => {
      socket.off('NEWS_FEED_UPDATED', handleFeedUpdated);
      socket.off('NEWS_BREAKING', handleBreakingNews);
      socket.off('NEWS_REFRESH_COUNTDOWN', handleCountdown);
      socket.off('NEWS_STATS_UPDATE', handleStats);
    };
  }, [socket]);

  const markNewsAsSeenAction = async () => {
    if (newArticles.length === 0) return;
    await markSeenInStorage(newArticles.map(a => a.id));
    setNewArticles([]);
    setArticles(prev => prev.map(a => ({ ...a, isNew: false })));
  };

  return {
    articles,
    newArticles,
    newCount: newArticles.length,
    loading,
    refreshing,
    lastRefreshed,
    nextRefreshIn,
    stats,
    breakingNews,
    sourcesActive,
    isOffline,
    markNewsAsSeen: markNewsAsSeenAction,
    dismissBreaking: () => setBreakingNews(null),
    manualRefresh
  };
}
