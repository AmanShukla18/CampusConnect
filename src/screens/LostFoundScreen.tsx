import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { onValue, ref, remove as removeEntry, update } from 'firebase/database';
import { useAuth } from '../context/AuthContext';
import { realtimeDb, auth } from '../lib/firebase';
import { useSocket } from '../context/SocketContext';
import { InlineVideo } from '../components/InlineVideo';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/ui';

type Item = {
  id: string;
  title: string;
  description?: string;
  location?: string;
  contact?: string;
  status?: string;
  date?: string;
  reportedByEmail?: string;
  reportedByUid?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
};

export default function LostFoundScreen({ navigation }: any) {
  const { email } = useAuth();
  const { colors, isDark } = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Claimed'>('All');
  const { socket } = useSocket();

  useEffect(() => {
    const dbRef = ref(realtimeDb, 'lostfound');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val() || {};
      const nextItems: Item[] = Object.keys(data).map((key) => {
        const entry = data[key] as any;
        const mediaUrl = entry.mediaUrl || entry.imageUrl;
        const mediaType = entry.mediaType || (mediaUrl ? 'image' : undefined);
        return { id: key, ...entry, mediaUrl, mediaType };
      });
      nextItems.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setItems(nextItems);
    });

    if (socket) {
      socket.on('lostfound:create', (newItem: Item) => {
        setItems((prev) => [newItem, ...prev]);
      });
      socket.on('lostfound:update', (updatedItem: Item) => {
        setItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
      });
      socket.on('lostfound:delete', (deletedId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== deletedId));
      });
    }

    return () => {
      unsubscribe();
      if (socket) {
        socket.off('lostfound:create');
        socket.off('lostfound:update');
        socket.off('lostfound:delete');
      }
    };
  }, [socket]);

  async function claim(id: string) {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to mark an item as claimed.');
      return;
    }

    try {
      await update(ref(realtimeDb, `lostfound/${id}`), { status: 'Claimed', claimedByUid: user.uid, claimedAt: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to mark item claimed', error);
      Alert.alert('Error', error?.message || 'Unable to update item.');
    }
  }

  async function remove(item: Item) {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to delete your items.');
      return;
    }

    const ownsByUid = item.reportedByUid && item.reportedByUid === user.uid;
    const ownsByEmail = !item.reportedByUid && item.reportedByEmail && item.reportedByEmail === (user.email || email);
    if (!ownsByUid && !ownsByEmail) {
      Alert.alert('Permission denied', 'You can only delete items you posted.');
      return;
    }

    try {
      await removeEntry(ref(realtimeDb, `lostfound/${item.id}`));
    } catch (error: any) {
      console.error('Failed to delete item', error);
      Alert.alert('Error', error?.message || 'Unable to delete item.');
    }
  }

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    subTitle: { color: colors.subText },
    section: { color: colors.text },
    card: { backgroundColor: colors.card, borderColor: colors.border },
    cardTitle: { color: colors.text },
    cardBody: { color: colors.subText },
    cardMeta: { color: colors.subText },
    chip: { backgroundColor: colors.card, borderColor: colors.border },
    chipText: { color: colors.subText },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipTextActive: { color: '#fff' },
    reportCard: { backgroundColor: colors.card, borderColor: colors.border },
    reportText: { color: colors.text },
    reportSub: { color: colors.subText },
    empty: { color: colors.subText },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Lost & Found</Text>
      <Text style={[{ marginBottom: 12 }, dynamicStyles.subTitle]}>Find or report items — instant updates</Text>
      <Text style={[styles.section, dynamicStyles.section]}>Look for lost object</Text>
      <View style={styles.filters}>
        {(['All', 'Active', 'Claimed'] as const).map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.chip, dynamicStyles.chip, filter === f && styles.chipActive, filter === f && dynamicStyles.chipActive]}>
            <Text style={[styles.chipText, dynamicStyles.chipText, filter === f && styles.chipTextActive, filter === f && dynamicStyles.chipTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={items.filter(i => filter === 'All' ? true : i.status === filter)}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <View style={[styles.card, dynamicStyles.card]}>
            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{item.title}</Text>
            {item.mediaUrl && (
              item.mediaType === 'video' ? (
                <InlineVideo uri={item.mediaUrl} style={styles.cardVideo} />
              ) : (
                <Image source={{ uri: item.mediaUrl }} style={styles.cardImage} />
              )
            )}
            {!!item.description && <Text style={[styles.cardBody, dynamicStyles.cardBody]}>{item.description}</Text>}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
              <View>
                <Text style={dynamicStyles.cardMeta}>Location: {item.location}</Text>
                <Text style={dynamicStyles.cardMeta}>Contact: {item.contact}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                {item.status !== 'Claimed' && (
                  <TouchableOpacity onPress={() => claim(item.id)}>
                    <Text style={{ color: '#3b5bfd', fontWeight: '600' }}>Mark Claimed</Text>
                  </TouchableOpacity>
                )}
                {email && item.reportedByEmail === email && (
                  <TouchableOpacity onPress={() => remove(item)}>
                    <Text style={{ color: '#ef4444', fontWeight: '700' }}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState title="No items yet" />}
      />
      <View style={[styles.reportCard, dynamicStyles.reportCard]}>
        <Text style={[{ fontWeight: '700', marginBottom: 6 }, dynamicStyles.reportText]}>Post a found object</Text>
        <Text style={[{ marginBottom: 12 }, dynamicStyles.reportSub]}>Help someone get their item back — report what you found.</Text>
        <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate('ReportFound')}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Report</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 12, backgroundColor: '#dbe5ff' },
  cardVideo: { width: '100%', height: 240, borderRadius: 16, marginBottom: 12, backgroundColor: '#000' },
  cardBody: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  filters: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: { backgroundColor: '#3b5bfd', borderColor: '#3b5bfd' },
  chipText: { fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  reportCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
  },
  reportBtn: {
    backgroundColor: '#3b5bfd',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});


