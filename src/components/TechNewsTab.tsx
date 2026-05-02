import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Linking, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../api/client';

type NewsItem = {
  id: number;
  title: string;
  url: string;
  source: string;
  description: string;
  date: string;
  score: number;
  comments: number;
};

export default function TechNewsTab() {
  const { colors, isDark } = useTheme();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/technews`);
      if (res.ok) {
        const data = await res.json();
        setNews(data);
      }
    } catch (e) {
      console.error('Failed to fetch tech news', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  function handleRefresh() {
    setRefreshing(true);
    fetchNews();
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const renderItem = ({ item }: { item: NewsItem }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.sourceBadge, { backgroundColor: isDark ? '#1e3a5f' : '#dbeafe' }]}>
          <Text style={[styles.sourceText, { color: isDark ? '#60a5fa' : '#2563eb' }]}>{item.source}</Text>
        </View>
        <Text style={[styles.timeText, { color: colors.subText }]}>{timeAgo(item.date)}</Text>
      </View>

      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={3}>{item.title}</Text>

      {item.description ? (
        <Text style={[styles.cardDesc, { color: colors.subText }]} numberOfLines={2}>{item.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <View style={styles.stat}>
          <Ionicons name="arrow-up" size={14} color="#f59e0b" />
          <Text style={[styles.statText, { color: colors.subText }]}>{item.score}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.subText} />
          <Text style={[styles.statText, { color: colors.subText }]}>{item.comments}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: colors.primary }]}>Read More</Text>
          <Ionicons name="open-outline" size={12} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subText }]}>Fetching latest tech news...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={news}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Ionicons name="newspaper-outline" size={20} color={colors.primary} />
            <Text style={[styles.listHeaderText, { color: colors.subText }]}>
              Top stories from Hacker News
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.subText }]}>No news available. Pull to refresh.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  listHeaderText: { fontSize: 13, fontWeight: '600' },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sourceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sourceText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  timeText: { fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', lineHeight: 22, marginBottom: 6 },
  cardDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '600' },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readMoreText: { fontSize: 12, fontWeight: '700' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});
