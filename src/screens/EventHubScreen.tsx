import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../api/client';
import CreateEventModal from '../components/CreateEventModal';
import RejectReasonModal from '../components/RejectReasonModal';
import PostponeModal from '../components/PostponeModal';
import TechNewsTab from '../components/TechNewsTab';

type HubEvent = {
  _id: string;
  title: string;
  type: string;
  description: string;
  date: string;
  time: string;
  schools: string[];
  mode: string;
  registrationDeadline?: string;
  maxParticipants?: number;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
  imageUrl?: string;
  status: string;
  createdByEmail: string;
  createdByName?: string;
  createdByRole?: string;
  approvedBy?: string;
  rejectionReason?: string;
  postponeReason?: string;
  newDate?: string;
  newTime?: string;
  createdAt: string;
};

const TYPE_COLORS: Record<string, string> = {
  Hackathon: '#8b5cf6',
  Workshop: '#3b82f6',
  Seminar: '#14b8a6',
  Competition: '#f97316',
  Other: '#6b7280',
};

const STATUS_COLORS: Record<string, string> = {
  approved: '#10b981',
  postponed: '#f59e0b',
  completed: '#6b7280',
  pending: '#eab308',
  rejected: '#ef4444',
};

const MODE_COLORS: Record<string, string> = {
  Online: '#3b82f6',
  Offline: '#10b981',
  Hybrid: '#8b5cf6',
};

export default function EventHubScreen({ navigation }: any) {
  const { userProfile, email } = useAuth();
  const { colors, isDark } = useTheme();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState<'events' | 'news'>('events');
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Modals
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editEvent, setEditEvent] = useState<HubEvent | null>(null);
  const [postponeEvent, setPostponeEvent] = useState<HubEvent | null>(null);
  const [rejectEvent, setRejectEvent] = useState<HubEvent | null>(null);

  // Detail expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isStudent = userProfile?.role === 'student' || (!userProfile?.role && userProfile?.designation === 'Student');
  const isTeacher = userProfile?.role === 'teacher' || userProfile?.designation === 'Teacher';
  const isAdmin = userProfile?.role === 'admin';
  const isReviewer = isTeacher || isAdmin;

  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      const url = `${API_BASE_URL}/api/events/hub?${params.toString()}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error('Error fetching hub events', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, filterStatus]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const refresh = () => fetchEvents();
    socket.on('hub-event:create', refresh);
    socket.on('hub-event:update', refresh);
    socket.on('hub-event:delete', refresh);
    socket.on('hub-event:request', refresh);
    return () => {
      socket.off('hub-event:create', refresh);
      socket.off('hub-event:update', refresh);
      socket.off('hub-event:delete', refresh);
      socket.off('hub-event:request', refresh);
    };
  }, [socket, fetchEvents]);

  async function handleCreateEvent(data: any) {
    const endpoint = isStudent ? '/api/events/request' : '/api/events/create';
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, createdByEmail: email }),
    });
    if (!res.ok) throw new Error('Failed');
    if (isStudent) {
      Alert.alert('Request Submitted ✅', 'Your event request has been sent for approval. Teachers and Admins will review it.');
    } else {
      Alert.alert('Event Published! 🎉', 'Your event is now live in the Event Hub.');
    }
    fetchEvents();
  }

  async function handleEditEvent(data: any) {
    if (!editEvent) return;
    const res = await fetch(`${API_BASE_URL}/api/events/${editEvent._id}/edit`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, requesterEmail: email }),
    });
    if (!res.ok) throw new Error('Failed');
    Alert.alert('Updated', 'Event has been updated.');
    setEditEvent(null);
    fetchEvents();
  }

  async function handlePostpone(data: { newDate: string; newTime: string; reason: string }) {
    if (!postponeEvent) return;
    const res = await fetch(`${API_BASE_URL}/api/events/${postponeEvent._id}/postpone`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, requesterEmail: email }),
    });
    if (!res.ok) throw new Error('Failed');
    Alert.alert('Postponed', 'Event has been postponed.');
    setPostponeEvent(null);
    fetchEvents();
  }

  async function handleDelete(eventId: string, eventTitle: string) {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_BASE_URL}/api/events/${eventId}/hub?requesterEmail=${encodeURIComponent(email || '')}`, { method: 'DELETE' });
              Alert.alert('Deleted', 'Event has been removed.');
              fetchEvents();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete event.');
            }
          },
        },
      ]
    );
  }

  async function handleReject(reason: string) {
    if (!rejectEvent) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${rejectEvent._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverEmail: email, reason }),
      });
      if (!res.ok) throw new Error('Failed');
      Alert.alert('Rejected', 'Event request has been rejected.');
      setRejectEvent(null);
      fetchEvents();
    } catch (e) {
      Alert.alert('Error', 'Failed to reject event.');
    }
  }

  function handleContactCreator(event: HubEvent) {
    const emailAddr = event.contactEmail || event.createdByEmail;
    Linking.openURL(`mailto:${emailAddr}?subject=Regarding: ${event.title}`);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const renderEventCard = ({ item }: { item: HubEvent }) => {
    const isExpanded = expandedId === item._id;
    const typeColor = TYPE_COLORS[item.type] || '#6b7280';
    const statusColor = STATUS_COLORS[item.status] || '#6b7280';
    const modeColor = MODE_COLORS[item.mode] || '#6b7280';

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setExpandedId(isExpanded ? null : item._id)}
        activeOpacity={0.8}
      >
        {/* Badges Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: typeColor }]}>{item.type}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: modeColor + '20' }]}>
            <Text style={[styles.badgeText, { color: modeColor }]}>{item.mode}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {item.status === 'approved' ? 'Upcoming' : item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>

        {/* Meta Row */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          <Text style={[styles.metaText, { color: colors.subText }]}>
            {formatDate(item.status === 'postponed' && item.newDate ? item.newDate : item.date)}
            {item.status === 'postponed' ? ' (Rescheduled)' : ''}
          </Text>
        </View>
        {item.time || (item.status === 'postponed' && item.newTime) ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.subText }]}>
              {item.status === 'postponed' && item.newTime ? item.newTime : item.time}
            </Text>
          </View>
        ) : null}

        {/* Schools Tags */}
        {item.schools && item.schools.length > 0 && (
          <View style={[styles.badgeRow, { marginTop: 6 }]}>
            {item.schools.map(s => (
              <View key={s} style={[styles.schoolTag, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.schoolTagText, { color: isDark ? '#94a3b8' : '#475569' }]}>{s}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Description / Read More */}
        <Text style={[styles.description, { color: colors.subText }]} numberOfLines={isExpanded ? undefined : 2}>
          {item.description}
        </Text>

        {/* Expanded details */}
        {isExpanded && (
          <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
            {item.contactName && (
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>Contact: {item.contactName}</Text>
              </View>
            )}
            {item.maxParticipants && (
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>Max Participants: {item.maxParticipants}</Text>
              </View>
            )}
            {item.registrationDeadline && (
              <View style={styles.metaRow}>
                <Ionicons name="hourglass-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>Reg. Deadline: {formatDate(item.registrationDeadline)}</Text>
              </View>
            )}
            {item.notes && (
              <Text style={[styles.notesText, { color: colors.subText }]}>📝 {item.notes}</Text>
            )}
            {item.status === 'postponed' && item.postponeReason && (
              <View style={[styles.reasonBox, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.reasonLabel}>⚠️ Postpone Reason</Text>
                <Text style={styles.reasonText}>{item.postponeReason}</Text>
              </View>
            )}
          </View>
        )}

        {/* Creator Info */}
        <View style={[styles.creatorRow, { borderTopColor: colors.border }]}>
          <View style={[styles.creatorTag, { backgroundColor: isDark ? '#1e293b' : '#eef2ff' }]}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
              {item.createdByName || item.createdByEmail} • {item.createdByRole || 'student'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {/* Contact Creator - Teachers + Admins */}
          {isReviewer && (
            <TouchableOpacity style={[styles.actionBtn, styles.contactBtn]} onPress={() => handleContactCreator(item)}>
              <Ionicons name="mail-outline" size={14} color="#3b82f6" />
              <Text style={styles.contactBtnText}>Contact</Text>
            </TouchableOpacity>
          )}
          {/* Admin Actions */}
          {isAdmin && (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => setEditEvent(item)}>
                <Ionicons name="create-outline" size={14} color="#8b5cf6" />
                <Text style={[styles.actionBtnText, { color: '#8b5cf6' }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.postponeBtn]} onPress={() => setPostponeEvent(item)}>
                <Ionicons name="time-outline" size={14} color="#f59e0b" />
                <Text style={[styles.actionBtnText, { color: '#f59e0b' }]}>Postpone</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item._id, item.title)}>
                <Ionicons name="trash-outline" size={14} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {/* Type filters */}
        <TouchableOpacity
          style={[styles.filterChip, !filterType && { backgroundColor: colors.primary }]}
          onPress={() => setFilterType('')}
        >
          <Text style={[styles.filterChipText, !filterType && { color: '#fff' }]}>All Types</Text>
        </TouchableOpacity>
        {['Hackathon', 'Workshop', 'Seminar', 'Competition'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.filterChip, filterType === t && { backgroundColor: TYPE_COLORS[t] }]}
            onPress={() => setFilterType(filterType === t ? '' : t)}
          >
            <Text style={[styles.filterChipText, filterType === t && { color: '#fff' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.filterDivider} />
        {/* Status filters */}
        {['approved', 'postponed', 'completed'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && { backgroundColor: STATUS_COLORS[s] }]}
            onPress={() => setFilterStatus(filterStatus === s ? '' : s)}
          >
            <Text style={[styles.filterChipText, filterStatus === s && { color: '#fff' }]}>
              {s === 'approved' ? 'Upcoming' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Event Hub</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {isReviewer && (
            <TouchableOpacity
              style={[styles.approvalBtn]}
              onPress={() => navigation.navigate('ApprovalDashboard')}
            >
              <Ionicons name="checkmark-done-circle-outline" size={16} color="#fff" />
              <Text style={styles.approvalBtnText}>Approvals</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.createBtnText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Ionicons name="trophy-outline" size={18} color={activeTab === 'events' ? colors.primary : colors.subText} />
          <Text style={[styles.tabText, activeTab === 'events' ? { color: colors.primary, fontWeight: '700' } : { color: colors.subText }]}>
            Events & Hackathons
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'news' && styles.activeTab]}
          onPress={() => setActiveTab('news')}
        >
          <Ionicons name="newspaper-outline" size={18} color={activeTab === 'news' ? colors.primary : colors.subText} />
          <Text style={[styles.tabText, activeTab === 'news' ? { color: colors.primary, fontWeight: '700' } : { color: colors.subText }]}>
            Tech News
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'events' ? (
        <>
          {renderFilters()}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={events}
              keyExtractor={(item) => item._id}
              renderItem={renderEventCard}
              contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => { setRefreshing(true); fetchEvents(); }}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="calendar-outline" size={56} color={colors.subText} />
                  <Text style={[styles.emptyTitle, { color: colors.text }]}>No Events Yet</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                    Be the first to create an event or hackathon!
                  </Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        <TechNewsTab />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateEvent}
      />

      {/* Edit Event Modal */}
      {editEvent && (
        <CreateEventModal
          visible={true}
          onClose={() => setEditEvent(null)}
          onSubmit={handleEditEvent}
          initialData={editEvent}
          isEdit
        />
      )}

      {/* Postpone Modal */}
      {postponeEvent && (
        <PostponeModal
          visible={true}
          onClose={() => setPostponeEvent(null)}
          onSubmit={handlePostpone}
          eventTitle={postponeEvent.title}
        />
      )}

      {/* Reject Modal */}
      {rejectEvent && (
        <RejectReasonModal
          visible={true}
          onClose={() => setRejectEvent(null)}
          onSubmit={handleReject}
          eventTitle={rejectEvent.title}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 28, fontWeight: '800' },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3b5bfd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  approvalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  approvalBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3b5bfd',
  },
  tabText: { fontSize: 13, fontWeight: '600' },

  // Filters
  filterContainer: { marginBottom: 4 },
  filterScroll: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterDivider: { width: 1, backgroundColor: '#d1d5db', marginHorizontal: 4 },

  // Cards
  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, lineHeight: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, fontWeight: '500' },
  schoolTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  schoolTagText: { fontSize: 11, fontWeight: '600' },
  description: { fontSize: 14, lineHeight: 20, marginTop: 8 },

  expandedSection: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 4 },
  notesText: { fontSize: 13, marginTop: 6, fontStyle: 'italic' },
  reasonBox: { padding: 10, borderRadius: 10, marginTop: 8 },
  reasonLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4, color: '#92400e' },
  reasonText: { fontSize: 13, color: '#92400e' },

  creatorRow: { marginTop: 12, paddingTop: 10, borderTopWidth: 1 },
  creatorTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  contactBtn: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  contactBtnText: { color: '#3b82f6', fontSize: 12, fontWeight: '600' },
  editBtn: { borderColor: '#8b5cf6', backgroundColor: '#f5f3ff' },
  postponeBtn: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  deleteBtn: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },

  // Loading / Empty
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
