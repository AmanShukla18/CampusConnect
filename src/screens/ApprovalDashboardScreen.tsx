import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../api/client';
import RejectReasonModal from '../components/RejectReasonModal';

type PendingEvent = {
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
  status: string;
  createdByEmail: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt: string;
};

const TYPE_COLORS: Record<string, string> = {
  Hackathon: '#8b5cf6',
  Workshop: '#3b82f6',
  Seminar: '#14b8a6',
  Competition: '#f97316',
  Other: '#6b7280',
};

export default function ApprovalDashboardScreen({ navigation }: any) {
  const { email } = useAuth();
  const { colors, isDark } = useTheme();
  const [pending, setPending] = useState<PendingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectEvent, setRejectEvent] = useState<PendingEvent | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/pending?requesterEmail=${encodeURIComponent(email || '')}`);
      if (res.ok) {
        const data = await res.json();
        setPending(data);
      }
    } catch (e) {
      console.error('Error fetching pending', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  async function handleApprove(event: PendingEvent) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${event._id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverEmail: email }),
      });
      if (res.ok) {
        Alert.alert('Approved ✅', `"${event.title}" has been approved and published!`);
        fetchPending();
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'Failed to approve');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to approve event');
    }
  }

  async function handleReject(reason: string) {
    if (!rejectEvent) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/events/${rejectEvent._id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverEmail: email, reason }),
      });
      if (res.ok) {
        Alert.alert('Rejected', `"${rejectEvent.title}" has been rejected.`);
        setRejectEvent(null);
        fetchPending();
      } else {
        const data = await res.json();
        Alert.alert('Error', data.error || 'Failed to reject');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to reject event');
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const renderItem = ({ item }: { item: PendingEvent }) => {
    const isExpanded = expandedId === item._id;
    const typeColor = TYPE_COLORS[item.type] || '#6b7280';

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Pending watermark */}
        <View style={styles.pendingWatermark}>
          <Ionicons name="hourglass-outline" size={14} color="#eab308" />
          <Text style={styles.pendingText}>PENDING APPROVAL</Text>
        </View>

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.typeBadgeText, { color: typeColor }]}>{item.type}</Text>
          </View>
          <Text style={[styles.timeAgo, { color: colors.subText }]}>{timeAgo(item.createdAt)}</Text>
        </View>

        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>

        {/* Requester info */}
        <View style={[styles.requesterRow, { backgroundColor: isDark ? '#1e293b' : '#fef3c7' }]}>
          <Ionicons name="person-outline" size={14} color="#92400e" />
          <Text style={styles.requesterText}>
            Requested by {item.createdByName || item.createdByEmail} ({item.createdByRole || 'student'})
          </Text>
        </View>

        {/* Event details */}
        <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : item._id)}>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.subText }]}>{formatDate(item.date)} • {item.time}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.subText }]}>{item.mode}</Text>
          </View>

          <Text style={[styles.description, { color: colors.subText }]} numberOfLines={isExpanded ? undefined : 3}>
            {item.description}
          </Text>
          <Text style={[styles.readMoreToggle, { color: colors.primary }]}>
            {isExpanded ? 'Show less ▲' : 'Show more ▼'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.expandedDetails, { borderTopColor: colors.border }]}>
            {item.schools && item.schools.length > 0 && (
              <View style={styles.metaRow}>
                <Ionicons name="school-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>Schools: {item.schools.join(', ')}</Text>
              </View>
            )}
            {item.contactName && (
              <View style={styles.metaRow}>
                <Ionicons name="call-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>{item.contactName} ({item.contactEmail})</Text>
              </View>
            )}
            {item.maxParticipants && (
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>Max: {item.maxParticipants}</Text>
              </View>
            )}
            {item.registrationDeadline && (
              <View style={styles.metaRow}>
                <Ionicons name="hourglass-outline" size={14} color={colors.subText} />
                <Text style={[styles.metaText, { color: colors.subText }]}>Deadline: {formatDate(item.registrationDeadline)}</Text>
              </View>
            )}
            {item.notes && (
              <Text style={[styles.notesText, { color: colors.subText }]}>📝 {item.notes}</Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejectEvent(item)}>
            <Ionicons name="close-circle" size={18} color="#fff" />
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>Approval Dashboard</Text>
      <Text style={[styles.subtitle, { color: colors.subText }]}>
        Review and decide on student event requests
      </Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={pending}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchPending(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.subText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Clear! 🎉</Text>
              <Text style={[styles.emptySubtitle, { color: colors.subText }]}>
                No pending event requests to review.
              </Text>
            </View>
          }
        />
      )}

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
  screenTitle: { fontSize: 24, fontWeight: '800', paddingHorizontal: 16, paddingTop: 16 },
  subtitle: { fontSize: 14, paddingHorizontal: 16, marginBottom: 12 },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  pendingWatermark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pendingText: { fontSize: 11, fontWeight: '800', color: '#eab308', letterSpacing: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  typeBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  timeAgo: { fontSize: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, lineHeight: 24 },

  requesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  requesterText: { fontSize: 12, fontWeight: '600', color: '#92400e' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, fontWeight: '500' },
  description: { fontSize: 14, lineHeight: 20, marginTop: 6 },
  readMoreToggle: { fontSize: 12, fontWeight: '700', marginTop: 6 },

  expandedDetails: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 4 },
  notesText: { fontSize: 13, marginTop: 6, fontStyle: 'italic' },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  rejectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
