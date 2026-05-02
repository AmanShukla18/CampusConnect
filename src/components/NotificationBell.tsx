import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../api/client';

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { colors, isDark } = useTheme();
  const { email } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch (e) { /* ignore */ }
  }, [email]);

  const fetchNotifications = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) { /* ignore */ }
    setLoading(false);
  }, [email]);

  useEffect(() => { fetchUnreadCount(); }, [fetchUnreadCount]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket || !email) return;
    const handler = () => {
      fetchUnreadCount();
      if (modalVisible) fetchNotifications();
    };
    socket.on(`notification:${email}`, handler);
    return () => { socket.off(`notification:${email}`, handler); };
  }, [socket, email, modalVisible, fetchUnreadCount, fetchNotifications]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  function openModal() {
    setModalVisible(true);
    fetchNotifications();
  }

  async function markAsRead(id: string) {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) { /* ignore */ }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function getIcon(type: string) {
    switch (type) {
      case 'event_request': return { name: 'add-circle', color: '#3b82f6' };
      case 'event_approved': return { name: 'checkmark-circle', color: '#10b981' };
      case 'event_rejected': return { name: 'close-circle', color: '#ef4444' };
      case 'event_postponed': return { name: 'time', color: '#f59e0b' };
      default: return { name: 'notifications', color: colors.primary };
    }
  }

  return (
    <>
      <TouchableOpacity style={styles.bellBtn} onPress={openModal}>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>🔔 Notifications</Text>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllRead}>
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subText} />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item }) => {
              const icon = getIcon(item.type);
              return (
                <TouchableOpacity
                  style={[
                    styles.notifItem,
                    { backgroundColor: item.read ? colors.card : (isDark ? '#1e293b' : '#f0f4ff'), borderColor: colors.border },
                  ]}
                  onPress={() => { if (!item.read) markAsRead(item._id); }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={icon.name as any} size={24} color={icon.color} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.notifTitle, { color: colors.text }]}>{item.title}</Text>
                    <Text style={[styles.notifMsg, { color: colors.subText }]} numberOfLines={2}>{item.message}</Text>
                    <Text style={[styles.notifTime, { color: colors.subText }]}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  {!item.read && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={colors.subText} />
                <Text style={[styles.emptyText, { color: colors.subText }]}>No notifications yet</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellBtn: { padding: 8, marginRight: 8, position: 'relative' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  notifTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  notifMsg: { fontSize: 13, lineHeight: 18 },
  notifTime: { fontSize: 11, marginTop: 4 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginTop: 4,
  },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
});
