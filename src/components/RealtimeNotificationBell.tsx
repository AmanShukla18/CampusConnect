import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';

type Notification = {
  id: string;
  message: string;
  type: string;
  eventId?: string;
  timestamp: Date;
  read: boolean;
};

export default function RealtimeNotificationBell() {
  const { socket } = useSocket();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewNotification = (data: any) => {
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        message: data.message,
        type: data.type,
        eventId: data.eventId,
        timestamp: new Date(),
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
      
      // Show generic toast globally
      showToast({ message: data.message, type: data.type === 'error' ? 'error' : 'info' });
    };

    socket.on('NOTIFICATION_NEW', handleNewNotification);

    return () => {
      socket.off('NOTIFICATION_NEW', handleNewNotification);
    };
  }, [socket, showToast]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
     if (type === 'event') return 'calendar';
     if (type === 'approval_request') return 'document-text';
     if (type === 'approval') return 'checkmark-circle';
     return 'notifications';
  };

  return (
    <View>
      <TouchableOpacity style={styles.bellBtn} onPress={() => { setShowDropdown(true); markAllRead(); }}>
        <Ionicons name="notifications-outline" size={24} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
             <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal visible={showDropdown} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
           <View style={styles.dropdown}>
              <View style={styles.dropdownHeader}>
                 <Text style={styles.dropdownTitle}>Notifications</Text>
              </View>
              <FlatList
                data={notifications}
                keyExtractor={item => item.id}
                ListEmptyComponent={<Text style={styles.emptyText}>No recent notifications</Text>}
                renderItem={({item}) => (
                  <View style={[styles.notifItem, item.read ? styles.readItem : styles.unreadItem]}>
                     <Ionicons name={(getIcon(item.type) as any)} size={20} color="#3b5bfd" />
                     <View style={{flex: 1, marginLeft: 10}}>
                        <Text style={styles.notifMsg}>{item.message}</Text>
                        <Text style={styles.time}>{item.timestamp.toLocaleTimeString()}</Text>
                     </View>
                  </View>
                )}
              />
           </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bellBtn: { padding: 8, position: 'relative' },
  badge: { position: 'absolute', top: 4, right: 6, backgroundColor: '#ef4444', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dropdown: { position: 'absolute', top: 60, right: 20, width: 300, maxHeight: 400, backgroundColor: '#fff', borderRadius: 12, shadowColor: '#000', shadowOffset: {width:0,height:8}, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10, overflow: 'hidden' },
  dropdownHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#f9fafb' },
  dropdownTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  notifItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  unreadItem: { backgroundColor: '#eaf0ff' },
  readItem: { backgroundColor: '#fff' },
  notifMsg: { fontSize: 14, color: '#374151', fontWeight: '500' },
  time: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  emptyText: { padding: 20, textAlign: 'center', color: '#6b7280' }
});
