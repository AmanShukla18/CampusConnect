import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, Modal, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import CalendarWidget from '../components/CalendarWidget';
import { EmptyState } from '../components/ui';

type Notice = {
  _id: string;
  id?: string;
  title: string;
  department?: string;
  year?: string;
  type?: string;
  content?: string;
  createdAt?: string;
  createdByEmail?: string;
};

export default function NoticesScreen() {
  const { email, userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Notice[]>([]);
  const [modal, setModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // New State for Dropdowns
  const [targetAudience, setTargetAudience] = useState('All');
  const [targetYear, setTargetYear] = useState('All Years');
  const [noticeType, setNoticeType] = useState('General');

  const { socket } = useSocket();

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      fetchNotices(mounted);
      return () => { mounted = false; };
    }, [])
  );

  useEffect(() => {
    let mounted = true;
    if (!socket) return;

    socket.on('notice:create', (newNotice: Notice) => {
      if (mounted) setItems((prev) => [newNotice, ...prev]);
    });

    socket.on('notice:delete', (deletedId: string) => {
      if (mounted) setItems((prev) => prev.filter((item) => (item._id || item.id) !== deletedId));
    });

    return () => {
      mounted = false;
      socket.off('notice:create');
      socket.off('notice:delete');
    };
  }, [socket]);

  async function fetchNotices(mounted = true) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notices`);
      if (response.ok) {
        const data = await response.json();
        if (mounted) setItems(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Failed');
      }
    } catch (e) {
      if (mounted) console.error('Failed to fetch notices', e);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotices(true);
    setRefreshing(false);
  };

  async function createNotice() {
    if (!newTitle) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          department: targetAudience === 'All' ? 'All' : targetAudience,
          type: noticeType,
          year: targetYear,
          createdByEmail: email,
        }),
      });

      if (response.ok) {
        setModal(false);
        setNewTitle('');
        setNewContent('');
        // Reset defaults
        setTargetAudience('All');
        setTargetYear('All Years');
        setNoticeType('General');
        fetchNotices(true);
      } else {
        Alert.alert('Error', 'Failed to publish notice.');
      }
    } catch (e) {
      console.error('Failed to create notice', e);
      Alert.alert('Network Error', 'Failed to save notice.');
    }
  }

  async function handleDelete(id: string) {
    Alert.alert('Delete Notice', 'Are you sure you want to delete this notice? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/notices/${id}?requesterEmail=${encodeURIComponent(email || '')}`, {
              method: 'DELETE',
            });
            if (response.ok) {
              setItems((prev) => prev.filter((item) => (item._id || item.id) !== id));
            } else {
              const err = await response.json();
              Alert.alert('Error', err?.error || 'Failed to delete notice.');
            }
          } catch (e) {
            console.error('Failed to delete notice', e);
            Alert.alert('Network Error', 'Could not reach server.');
          }
      }}
    ]);
  }

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const needle = search.toLowerCase();
    return items.filter((notice) =>
      [notice.title, notice.content, notice.department, notice.type]
        .filter(Boolean)
        .some((field) => (field || '').toLowerCase().includes(needle))
    );
  }, [items, search]);

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    input: { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
    card: { backgroundColor: colors.card, borderColor: colors.border },
    cardTitle: { color: colors.text },
    cardBody: { color: colors.subText },
    cardMeta: { color: colors.subText },
    iconContainer: { backgroundColor: isDark ? '#1e293b' : '#eaf0ff' },
    empty: { color: colors.subText },
    modalCard: { backgroundColor: colors.card },
    label: { color: colors.text },
    dropdownBtn: { backgroundColor: colors.inputBg, borderColor: colors.border },
    dropdownBtnText: { color: colors.text },
    dropdownList: { backgroundColor: colors.card, borderColor: colors.border },
    dropdownItem: { borderBottomColor: colors.border },
    dropdownItemText: { color: colors.text },
  };

  // Custom Dropdown Component
  const Dropdown = ({ label, value, options, onSelect }: { label: string, value: string, options: string[], onSelect: (val: string) => void }) => {
    const [visible, setVisible] = useState(false);
    return (
      <View style={{ marginBottom: 16, zIndex: visible ? 1000 : 1 }}>
        <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
        <TouchableOpacity style={[styles.dropdownBtn, dynamicStyles.dropdownBtn]} onPress={() => setVisible(!visible)}>
          <Text style={[styles.dropdownBtnText, dynamicStyles.dropdownBtnText]}>{value}</Text>
          <Text style={{ color: '#3b5bfd' }}>▼</Text>
        </TouchableOpacity>
        {visible && (
          <View style={[styles.dropdownList, dynamicStyles.dropdownList]}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.dropdownItem, dynamicStyles.dropdownItem]}
                onPress={() => {
                  onSelect(opt);
                  setVisible(false);
                }}
              >
                <Text style={[styles.dropdownItemText, dynamicStyles.dropdownItemText, value === opt && { color: '#3b5bfd', fontWeight: '700' }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Notices</Text>
      <TextInput
        placeholder="Search notices, keywords, department..."
        placeholderTextColor={colors.subText}
        value={search}
        onChangeText={setSearch}
        style={[styles.input, dynamicStyles.input]}
      />
      <FlatList
        data={filteredItems}
        ListHeaderComponent={<CalendarWidget />}
        keyExtractor={(n) => n._id || n.id || Math.random().toString()}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, dynamicStyles.card]}>
            <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
              <Text style={{ fontSize: 20 }}>📢</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{item.title}</Text>
              {!!item.content && <Text style={[styles.cardBody, dynamicStyles.cardBody]}>{item.content}</Text>}
              <Text style={[styles.cardMeta, dynamicStyles.cardMeta]}>
                {[item.department, item.type, item.year].filter(Boolean).join(' • ')}
              </Text>
            </View>
            {(userProfile?.role === 'teacher' || userProfile?.role === 'admin' || item.createdByEmail === email) && (
              <TouchableOpacity onPress={() => handleDelete(item._id || item.id || '')} style={{ padding: 8 }}>
                <Text style={{ fontSize: 18, color: '#ef4444' }}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={<EmptyState title="No notices yet" /> }
      />

      {/* Only show Add button for Teachers */}
      {userProfile?.designation === 'Teacher' && (
        <TouchableOpacity style={styles.fab} onPress={() => setModal(true)}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, dynamicStyles.modalCard]}>
            <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>Create Notice</Text>

            <TextInput placeholder="Title" placeholderTextColor={colors.subText} value={newTitle} onChangeText={setNewTitle} style={[styles.input, dynamicStyles.input]} />

            <Dropdown
              label="Target Audience"
              value={targetAudience}
              options={['All', ...(userProfile?.school ? [userProfile.school] : [])]}
              onSelect={setTargetAudience}
            />

            <Dropdown
              label="Year"
              value={targetYear}
              options={['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year']}
              onSelect={setTargetYear}
            />

            <Dropdown
              label="Type"
              value={noticeType}
              options={['General', 'Event', 'Placement', 'Academic']}
              onSelect={setNoticeType}
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor={colors.subText}
              value={newContent}
              onChangeText={setNewContent}
              style={[styles.input, dynamicStyles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <TouchableOpacity style={[styles.fab, { position: 'relative', backgroundColor: isDark ? '#374151' : '#eaf0ff', flex: 1, right: 0, bottom: 0 }]} onPress={() => setModal(false)}>
                <Text style={{ color: '#3b5bfd', fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.fab, { position: 'relative', flex: 1, right: 0, bottom: 0 }]}
                onPress={createNotice}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, marginTop: 10 },
  input: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  cardBody: { lineHeight: 22, fontSize: 15 },
  cardMeta: { fontSize: 12, marginTop: 12, fontWeight: '600' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#3b5bfd',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10, maxHeight: '85%' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  dropdownBtn: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownBtnText: { fontSize: 15 },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 4,
    padding: 4,
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 15 },
});
