import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui/EmptyState';

export default function SearchScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const { userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'events' | 'resources'>('users');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (query.trim().length > 1) {
      const timeout = setTimeout(() => {
        performSearch(mounted);
      }, 500);
      return () => {
        clearTimeout(timeout);
        mounted = false;
      };
    } else {
      setResults([]);
      return () => { mounted = false; };
    }
  }, [query, activeTab]);

  async function performSearch(mounted = true) {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = `/api/search/users?q=${encodeURIComponent(query)}`;
      if (activeTab === 'events') endpoint = `/api/events?q=${encodeURIComponent(query)}`;
      if (activeTab === 'resources') endpoint = `/api/resources?search=${encodeURIComponent(query)}`;
      
      const res = await fetch(`${API_BASE_URL}${endpoint}`);
      if (res.ok) {
        let data = await res.json();
        if (activeTab === 'events') {
             data = data.filter((e: any) => e.title.toLowerCase().includes(query.toLowerCase()) || (e.description && e.description.toLowerCase().includes(query.toLowerCase())));
        }
        if (mounted) setResults(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      if (mounted) console.error(e);
    } finally {
      if (mounted) setLoading(false);
    }
  }

  const renderUser = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: item.photoUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.role, { color: colors.subText }]}>{item.role === 'teacher' ? 'Teacher' : 'Student'} • {item.school}</Text>
      </View>
    </View>
  );

  const renderEvent = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.role, { color: colors.subText }]}>{new Date(item.date).toDateString()} • {item.location}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Event</Text>
      </View>
    </View>
  );

  const renderResource = ({ item }: any) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.role, { color: colors.subText }]}>{item.subject} • {item.type}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: '#10b98120' }]}>
        <Text style={{ color: '#10b981', fontSize: 12, fontWeight: '600' }}>Resource</Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.searchBar, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.subText} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search Global..."
            placeholderTextColor={colors.subText}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.subText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        {['users', 'events', 'resources'].map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]} onPress={() => setActiveTab(tab as any)}>
            <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.subText }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
          <SkeletonLoader variant="card" height={80} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={activeTab === 'users' ? renderUser : activeTab === 'events' ? renderEvent : renderResource}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <EmptyState 
              variant={query.length > 1 ? 'no-results' : 'no-data'} 
              title={query.length > 1 ? 'No results found' : 'Start Searching'}
              subtitle={query.length > 1 ? 'Try adjusting your search query.' : 'Search for users, events, and resources globally.'}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44 },
  input: { flex: 1, fontSize: 16 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  role: { fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }
});
