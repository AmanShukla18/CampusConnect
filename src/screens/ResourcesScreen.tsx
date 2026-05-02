import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Linking, Image, ScrollView, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/ui';

type Resource = {
  _id: string;
  title: string;
  description?: string;
  subject?: string;
  school?: string;
  type?: string; 
  url?: string;
  thumbnailUrl?: string;
  downloads?: number;
  uploadedByName?: string;
  uploadedByEmail?: string;
  createdAt: string;
};

export default function ResourcesScreen() {
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const [q, setQ] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [items, setItems] = useState<Resource[]>([]);
  const navigation = useNavigation() as any;

  const isTeacher = userProfile?.designation === 'Teacher';
  const isAdmin = userProfile?.role === 'admin';

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      fetchResources(mounted);
      return () => { mounted = false; };
    }, [userProfile?.school, userProfile?.role])
  );

  const { socket } = useSocket();

  useEffect(() => {
    let mounted = true;
    if (!socket) return;
    
    const handleCreate = (newResource: Resource) => {
      if (!mounted) return;
      if (isAdmin || !userProfile?.school || !newResource.school || newResource.school === 'All' || newResource.school === userProfile.school) {
        setItems((prev) => [newResource, ...prev]);
      }
    };
    
    const handleDeleteEvent = (deletedId: string) => {
      if (!mounted) return;
      setItems((prev) => prev.filter((item) => item._id !== deletedId));
    };

    socket.on('resource:create', handleCreate);
    socket.on('resource:delete', handleDeleteEvent);
    return () => {
      mounted = false;
      socket.off('resource:create', handleCreate);
      socket.off('resource:delete', handleDeleteEvent);
    };
  }, [socket, userProfile, isAdmin]);

  async function handleDelete(id: string) {
    Alert.alert('Delete Resource', 'Are you sure you want to delete this resource?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/resources/${id}?requesterEmail=${encodeURIComponent(userProfile?.email || '')}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              setItems((prev) => prev.filter((item) => item._id !== id));
            } else {
              const err = await response.json();
              Alert.alert('Error', err?.error || 'Failed to delete resource');
            }
          } catch (e) {
            console.error('Failed to delete resource', e);
            Alert.alert('Network Error', 'Could not reach server.');
          }
      }}
    ]);
  }

  async function fetchResources(mounted = true) {
    try {
      const schoolQuery = (!isAdmin && userProfile?.school) ? `school=${encodeURIComponent(userProfile.school)}` : '';
      const response = await fetch(`${API_BASE_URL}/api/resources?${schoolQuery}`);
      if (response.ok) {
        const data = await response.json();
        if (mounted) {
           setItems(Array.isArray(data) ? data : []);
        }
      } else {
        throw new Error('Failed to fetch');
      }
    } catch (e) {
      if (mounted) {
        console.error('Failed to fetch resources', e);
        Alert.alert('Network Error', 'Failed to load resources. Showing cached or offline data if available.');
      }
    }
  }

  const handleOpenLink = async (resource: Resource) => {
    if (!resource.url) {
      Alert.alert('No Link', 'This resource does not have a URL provided.');
      return;
    }
    
    try {
      // Track the download/open
      await fetch(`${API_BASE_URL}/api/resources/${resource._id}/download`, { method: 'POST' });
      // Update local state for optimistic UI
      setItems(prev => prev.map(i => i._id === resource._id ? { ...i, downloads: (i.downloads || 0) + 1 } : i));
    } catch(e) {
      console.log('Error tracking download', e);
    }
    
    Linking.openURL(resource.url);
  };

  const filteredResources = useMemo(() => {
    let result = items;
    if (activeType !== 'All') {
      result = result.filter(r => (r.type || 'link').toLowerCase() === activeType.toLowerCase());
    }
    if (q) {
      const needle = q.toLowerCase();
      result = result.filter((item) =>
        [item.title, item.subject, item.description, item.uploadedByName]
          .filter(Boolean)
          .some((field) => (field || '').toLowerCase().includes(needle))
      );
    }
    return result;
  }, [items, q, activeType]);

  const getTypeIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'pdf') return 'document-text';
    if (t === 'video') return 'play-circle';
    if (t === 'image') return 'image';
    return 'link';
  };

  const getTypeColor = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t === 'pdf') return '#ef4444'; // Red
    if (t === 'video') return '#8b5cf6'; // Purple
    if (t === 'image') return '#10b981'; // Green
    return '#3b82f6'; // Blue
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.title, { color: colors.text }]}>Study Resources</Text>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.subText} style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search notes, past papers, videos..."
            placeholderTextColor={colors.subText}
            value={q}
            onChangeText={setQ}
            style={[styles.input, { color: colors.text }]}
          />
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['All', 'PDF', 'Video', 'Link', 'Image'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.filterTag,
                  { backgroundColor: activeType === t ? '#3b5bfd' : (isDark ? '#374151' : '#f3f4f6') }
                ]}
                onPress={() => setActiveType(t)}
              >
                <Text style={{ 
                  color: activeType === t ? '#fff' : colors.text, 
                  fontWeight: activeType === t ? '700' : '600',
                  fontSize: 14 
                }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <FlatList
        data={filteredResources}
        keyExtractor={(n) => n._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => {
          const typeColor = getTypeColor(item.type);
          return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {item.thumbnailUrl ? (
                <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.iconContainer, { backgroundColor: typeColor + '15' }]}>
                  <Ionicons name={getTypeIcon(item.type)} size={32} color={typeColor} />
                </View>
              )}
              
              <View style={styles.cardContent}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                    {item.subject && <Text style={[styles.cardSub, { color: colors.subText }]}>{item.subject}</Text>}
                  </View>
                  <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
                    <Text style={{ color: typeColor, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{item.type || 'LINK'}</Text>
                  </View>
                </View>

                {item.description ? (
                  <Text style={[styles.description, { color: colors.subText }]} numberOfLines={2}>{item.description}</Text>
                ) : null}

                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="download-outline" size={14} color={colors.subText} />
                    <Text style={{ color: colors.subText, fontSize: 12, marginLeft: 4 }}>{item.downloads || 0} views</Text>
                    
                    {item.uploadedByName && (
                      <>
                        <Text style={{ color: colors.subText, marginHorizontal: 6 }}>•</Text>
                        <Text style={{ color: colors.subText, fontSize: 12 }}>{item.uploadedByName}</Text>
                      </>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    {(isAdmin || item.uploadedByEmail === userProfile?.email) && (
                      <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ padding: 6 }}>
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                      onPress={() => handleOpenLink(item)} 
                      style={[styles.actionBtn, { backgroundColor: typeColor }]}
                    >
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>Open</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState 
            title="No Resources Found" 
            subtitle="There are currently no resources available matching your criteria." 
            icon={<Ionicons name="folder-open-outline" size={64} color={colors.subText} style={{ opacity: 0.5 }} />}
          />
        }
      />

      {(isTeacher || isAdmin) && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('UploadResource' as any)}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, marginTop: 10 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  filtersWrapper: {
    marginBottom: 8,
  },
  filterTag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  card: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  thumbnail: {
    width: 100,
    height: '100%',
    backgroundColor: '#f3f4f6',
  },
  iconContainer: {
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  empty: { textAlign: 'center', marginTop: 16, fontSize: 16, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#3b5bfd',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
});
