import { useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../api/client';
import { UnifiedNewsItem } from './useLiveNews';

type Pagination = { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean };

export function useNewsArchive() {
  const [articles, setArticles] = useState<UnifiedNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0, hasNext: false, hasPrev: false });
  const [filters, setFilters] = useState({ category: 'recent', source: 'all', tag: '', search: '', dateFrom: '', dateTo: '', sortBy: 'published_at' });
  const [availableTags, setAvailableTags] = useState<{_id: string, count: number}[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/news/archive/tags`)
      .then(res => res.json())
      .then(data => setAvailableTags(data))
      .catch();
  }, []);

  const fetchPage = useCallback(async (page: number, append = false, currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, string> = {
         page: page.toString(),
         limit: '20',
         sortBy: currentFilters.sortBy
      };
      
      if (currentFilters.category && currentFilters.category !== 'all') params.category = currentFilters.category;
      if (currentFilters.source && currentFilters.source !== 'all') params.source = currentFilters.source;
      if (currentFilters.tag) params.tag = currentFilters.tag;
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.dateFrom) params.dateFrom = currentFilters.dateFrom;
      if (currentFilters.dateTo) params.dateTo = currentFilters.dateTo;
      
      const query = new URLSearchParams(params).toString();

      const res = await fetch(`${API_BASE_URL}/api/news/archive?${query}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      
      if (append) {
         setArticles(prev => [...prev, ...data.articles]);
      } else {
         setArticles(data.articles);
      }
      setPagination(data.pagination);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
     fetchPage(1, false, filters);
  }, [filters, fetchPage]);

  const setFilter = (key: string, value: string) => {
     setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const clearFilters = () => {
     setFilters({ category: 'recent', source: 'all', tag: '', search: '', dateFrom: '', dateTo: '', sortBy: 'published_at' });
  };

  const loadMore = () => {
    if (pagination.hasNext && !loading) {
       fetchPage(pagination.page + 1, true);
    }
  };

  return {
    articles,
    loading,
    error,
    pagination,
    filters,
    availableTags,
    fetchPage: (p: number) => fetchPage(p, false),
    setFilter,
    clearFilters,
    search: (query: string) => setFilter('search', query),
    loadMore
  };
}
