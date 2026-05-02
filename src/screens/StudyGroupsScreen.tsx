import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Linking, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { EmptyState } from '../components/ui';

type Message = {
  _id: string;
  sender: string;
  senderName?: string;
  senderPhoto?: string;
  content?: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
};

type Member = {
  email: string;
  name: string;
  photoUrl?: string;
};

type Group = {
  _id: string;
  name: string;
  subject?: string;
  members?: string[] | Member[]; // Can be strings (list view) or objects (detail view)
  admins?: string[];
  joinRequests?: string[] | Member[];
  createdByEmail?: string;
  createdByDesignation?: string;
  school?: string;
  status?: string;
  approvedBy?: string;
  messages?: Message[];
};

export default function StudyGroupsScreen({ navigation }: any) {
  const { email, userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const [groups, setGroups] = useState<Group[]>([]);
  const [pendingGroups, setPendingGroups] = useState<Group[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false); // Group Info Modal
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const isTeacher = userProfile?.designation === 'Teacher';

  useEffect(() => {
    fetchGroups();
  }, [userProfile]);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleGroupCreate = (newGroup: Group) => {
      if (newGroup.status === 'Pending') {
        if (isTeacher && userProfile?.school === newGroup.school) {
          setPendingGroups((prev) => [newGroup, ...prev]);
        } else if (!isTeacher && newGroup.createdByEmail === email) {
          setGroups((prev) => [newGroup, ...prev]);
        }
      } else {
        setGroups((prev) => [newGroup, ...prev]);
      }
    };

    const handleGroupUpdate = (updatedGroup: Group) => {
      // Update in pending list
      setPendingGroups((prev) => {
        const index = prev.findIndex((g) => g._id === updatedGroup._id);
        if (index !== -1) {
          // If approved, remove from pending
          if (updatedGroup.status === 'Approved') {
            return prev.filter((g) => g._id !== updatedGroup._id);
          }
          // Otherwise update
          const newPending = [...prev];
          newPending[index] = updatedGroup;
          return newPending;
        }
        return prev;
      });

      // Update in main list
      setGroups((prev) => {
        const index = prev.findIndex((g) => g._id === updatedGroup._id);
        if (index !== -1) {
          const newGroups = [...prev];
          newGroups[index] = updatedGroup;
          return newGroups;
        }
        // If it was pending and now approved, add to main list
        if (updatedGroup.status === 'Approved') {
          return [updatedGroup, ...prev];
        }
        return prev;
      });

      // Update active group if open
      if (activeGroup && activeGroup._id === updatedGroup._id) {
        // We need to be careful not to overwrite populated members with just IDs if the socket event sends just IDs
        // Ideally, we should re-fetch details or merge carefully.
        // For now, let's just trigger a re-fetch of details to be safe and get populated data.
        fetchGroupDetails(updatedGroup._id).then(() => {
          // Check if we are still a member
          // Note: updatedGroup from socket might not have populated members, so we rely on the fetch above or check the ID list if available
          const isStillMember = (updatedGroup.members ?? []).some(m => (typeof m === 'string' ? m === email : m.email === email));
          const isAdmin = userProfile?.role === 'admin';
          if (updatedGroup.members && !isStillMember && !isAdmin && activeGroup._id === updatedGroup._id) {
            Alert.alert('Removed', 'You have been removed from this group.');
            setDetailVisible(false);
            setInfoVisible(false);
            setActiveGroup(null);
          }
        });
      }
    };

    const handleGroupDelete = (deletedId: string) => {
      setPendingGroups((prev) => prev.filter((g) => g._id !== deletedId));
      setGroups((prev) => prev.filter((g) => g._id !== deletedId));
      if (activeGroup && activeGroup._id === deletedId) {
        setDetailVisible(false);
        setInfoVisible(false);
        setActiveGroup(null);
      }
    };

    socket.on('group:create', handleGroupCreate);
    socket.on('group:update', handleGroupUpdate);
    socket.on('group:delete', handleGroupDelete);

    return () => {
      socket.off('group:create', handleGroupCreate);
      socket.off('group:update', handleGroupUpdate);
      socket.off('group:delete', handleGroupDelete);
    };
  }, [socket, isTeacher, userProfile, email, activeGroup]);

  // Polling for active group messages
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (detailVisible && activeGroup) {
      fetchGroupDetails(activeGroup._id); // Initial fetch
      interval = setInterval(() => {
        fetchGroupDetails(activeGroup._id);
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(interval);
  }, [detailVisible, activeGroup?._id]);

  async function fetchGroupDetails(groupId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setActiveGroup(data);
      }
    } catch (e) {
      console.error('Failed to fetch group details', e);
    }
  }

  async function fetchGroups() {
    try {
      const isAdmin = userProfile?.role === 'admin';

      // Fetch approved groups
      // If Admin, ignore school filter? Or keep it? Assuming Global Admin wants to see all.
      const schoolQuery = (userProfile?.school && !isAdmin) ? `&school=${encodeURIComponent(userProfile.school)}` : '';

      const response = await fetch(`${API_BASE_URL}/api/groups?status=Approved${schoolQuery}`);
      let approvedData: Group[] = [];
      if (response.ok) {
        approvedData = await response.json();
      }

      let pendingData: Group[] = [];

      // If teacher, fetch pending groups from their school
      if (isTeacher && userProfile?.school) {
        const pendingResponse = await fetch(`${API_BASE_URL}/api/groups?status=Pending&school=${encodeURIComponent(userProfile.school)}`);
        if (pendingResponse.ok) {
          const teacherPendingData = await pendingResponse.json();
          setPendingGroups(teacherPendingData);
        }
      } else if (isAdmin) {
        // Admin sees ALL pending groups
        const pendingResponse = await fetch(`${API_BASE_URL}/api/groups?status=Pending`);
        if (pendingResponse.ok) {
          const adminPendingData = await pendingResponse.json();
          setPendingGroups(adminPendingData);
        }
      } else if (!isTeacher && email) {
        // If student, fetch their own pending requests
        const myPendingResponse = await fetch(`${API_BASE_URL}/api/groups?status=Pending&createdByEmail=${encodeURIComponent(email)}`);
        if (myPendingResponse.ok) {
          pendingData = await myPendingResponse.json();
        }
      }

      setGroups([...pendingData, ...approvedData]);
    } catch (e) {
      console.error('Failed to fetch groups', e);
    }
  }

  async function create() {
    if (!name || !subject) {
      return Alert.alert('Missing Fields', 'Please provide group name and subject');
    }
    if (!userProfile) {
      return Alert.alert('Error', 'User profile not loaded');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          subject,
          createdByEmail: email,
          createdByDesignation: userProfile.designation,
          school: userProfile.school,
        }),
      });

      if (response.ok) {
        const created = await response.json();
        if (created.status === 'Pending') {
          Alert.alert('Request Submitted', 'Your study group request has been submitted for teacher approval.');
        } else {
          Alert.alert('Success', 'Study group created successfully!');
        }
        setName('');
        setSubject('');
        setModalVisible(false);
        fetchGroups();
      } else {
        Alert.alert('Error', 'Failed to create group');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create group');
    }
  }

  async function approveGroup(groupId: string, action: 'approve' | 'reject') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${groupId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverEmail: email,
          approverDesignation: userProfile?.designation,
          action,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', `Group ${action}d successfully`);
        fetchGroups();
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to update group');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update group');
    }
  }

  async function join(id: string) {
    if (!email) return Alert.alert('Sign in required', 'You need to be logged in to join groups.');
    try {
      const response = await fetch(`${API_BASE_URL}/api/groups/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Join request sent! An admin will approve your request.');
        fetchGroups();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to join group');
    }
  }



  // Helper to check if user is a member (handles both string[] and Member[])
  const isMember = (group: Group) => {
    return (group?.members ?? []).some(m => (typeof m === 'string' ? m === email : m.email === email));
  };

  const isAdmin = (group: Group) => {
    if (userProfile?.role === 'admin') return true; // Global Admin override
    if ((group?.admins ?? []).length > 0) {
      return (group?.admins ?? []).includes(email || '');
    }
    // Fallback for older groups or if admins array is empty
    return group?.createdByEmail === email;
  };

  const isPending = (group: Group) => {
    return (group?.joinRequests ?? []).some(m => (typeof m === 'string' ? m === email : m.email === email));
  };

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    createBtn: { backgroundColor: colors.primary, shadowColor: colors.primary },
    input: { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
    card: { backgroundColor: colors.card, borderColor: colors.border },
    cardTitle: { color: colors.text },
    cardSub: { color: colors.subText },
    pendingSection: { backgroundColor: isDark ? '#422006' : '#fff8e1', borderColor: isDark ? '#713f12' : '#ffeeba' },
    sectionTitle: { color: isDark ? '#fcd34d' : '#b45309' },
    pendingCard: { backgroundColor: colors.card },
    modalContent: { backgroundColor: colors.card },
    modalText: { color: colors.text },
    chatModalContent: { backgroundColor: colors.background },
    chatHeader: { backgroundColor: colors.card, borderBottomColor: colors.border },
    chatTitle: { color: colors.text },
    chatSubtitle: { color: colors.subText },
    messageList: { backgroundColor: colors.background },
    messageBubbleOther: { backgroundColor: colors.card, borderColor: colors.border },
    messageTextOther: { color: colors.text },
    inputRow: { backgroundColor: colors.card, borderTopColor: colors.border },
    chatInput: { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
    previewContainer: { backgroundColor: colors.inputBg, borderTopColor: colors.border },
    filePreview: { backgroundColor: colors.card, borderColor: colors.border },
    filePreviewName: { color: colors.text },
    memberRow: { borderBottomColor: colors.border },
    memberName: { color: colors.text },
    memberEmail: { color: colors.subText },
    sectionHeader: { color: colors.subText },
    cancelBtn: { backgroundColor: isDark ? '#374151' : '#eaf0ff' },
    cancelBtnText: { color: colors.primary },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Study Groups</Text>
      <TouchableOpacity style={[styles.createBtn, dynamicStyles.createBtn]} onPress={() => setModalVisible(true)}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>
          {isTeacher || userProfile?.role === 'admin' ? 'Create New Group' : 'Request Study Group'}
        </Text>
      </TouchableOpacity>

      {/* Pending Approvals Section (Teachers Only) */}
      {isTeacher && (pendingGroups ?? []).length > 0 && (
        <View style={[styles.pendingSection, dynamicStyles.pendingSection]}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Pending Approvals</Text>
          {(pendingGroups ?? []).map((group) => (
            <View key={group._id} style={[styles.pendingCard, dynamicStyles.pendingCard]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{group.name}</Text>
                <Text style={[styles.cardSub, dynamicStyles.cardSub, { fontSize: 12 }]}>
                  {group.subject} • Requested by {group.createdByEmail}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => approveGroup(group._id, 'approve')}
                >
                  <Text style={{ color: '#10b981', fontWeight: '700' }}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => approveGroup(group._id, 'reject')}
                >
                  <Text style={{ color: '#ef4444', fontWeight: '700' }}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Modal for group creation */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <Text style={[{ fontWeight: '700', fontSize: 18, marginBottom: 8 }, dynamicStyles.modalText]}>
              {isTeacher ? 'Create Study Group' : 'Request Study Group'}
            </Text>
            {!isTeacher && (
              <Text style={[{ fontSize: 12, marginBottom: 12 }, dynamicStyles.cardSub]}>
                Your request will be sent to teachers for approval
              </Text>
            )}
            <TextInput placeholder="Group name" placeholderTextColor={colors.subText} value={name} onChangeText={setName} style={[styles.input, dynamicStyles.input]} />
            <TextInput placeholder="Subject" placeholderTextColor={colors.subText} value={subject} onChangeText={setSubject} style={[styles.input, dynamicStyles.input]} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={[styles.cancelBtn, dynamicStyles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelBtnText, dynamicStyles.cancelBtnText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={create}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {isTeacher || userProfile?.role === 'admin' ? 'Create' : 'Submit Request'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={groups}
        keyExtractor={(g) => g._id}
        renderItem={({ item }) => {
          const member = isMember(item);
          const pending = isPending(item);
          return (
            <TouchableOpacity onPress={() => {
              if (member || item.status === 'Pending' || userProfile?.role === 'admin') {
                navigation.navigate('GroupChat', { groupId: item._id, groupName: item.name });
              } else if (pending) {
                Alert.alert('Pending', 'Your request to join this group is pending approval.');
              } else {
                Alert.alert('Join Group', 'Please request to join the group to view details.');
              }
            }}>
              <View style={[styles.card, dynamicStyles.card]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{item.name}</Text>
                    <Text style={[styles.cardSub, dynamicStyles.cardSub, { fontSize: 14, marginBottom: 4 }]}>{item.subject}</Text>
                    {item.school && <Text style={[styles.cardSub, dynamicStyles.cardSub, { fontSize: 12, fontWeight: '500' }]}>{item.school}</Text>}
                  </View>
                  {item.status === 'Pending' && (
                    <View style={{ backgroundColor: '#fff8e1', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ffeeba' }}>
                      <Text style={{ color: '#b45309', fontSize: 11, fontWeight: '700' }}>Pending</Text>
                    </View>
                  )}
                </View>

                <View style={styles.avatarRow}>
                  {/* In list view, members is likely string[] */}
                  {(item.members ?? []).slice(0, 5).map((m, i) => (
                    <View key={i} style={styles.avatarBubble}>
                      <Text style={styles.avatarText}>
                        {(typeof m === 'string' ? m : m.name).charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                  {(item.members?.length || 0) > 5 && (
                    <View style={[styles.avatarBubble, styles.moreBubble]}>
                      <Text style={[styles.avatarText, styles.moreText]}>+{item.members!.length - 5}</Text>
                    </View>
                  )}
                </View>

                {item.status !== 'Pending' && userProfile?.role !== 'admin' && (
                  <TouchableOpacity
                    style={[styles.joinBtn, member && styles.viewBtn, pending && styles.pendingBtn]}
                    onPress={() => {
                      if (member) {
                        navigation.navigate('GroupChat', { groupId: item._id, groupName: item.name });
                      } else if (pending) {
                        Alert.alert('Pending', 'Your request to join this group is pending approval.');
                      } else {
                        join(item._id);
                      }
                    }}
                  >
                    <Text style={{ color: member ? '#fff' : (pending ? '#b45309' : '#3b5bfd'), fontWeight: '700' }}>
                      {member ? 'Open Chat' : (pending ? 'Requested' : 'Request to Join')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<EmptyState title="No groups yet" subtitle="Join or create a study group to get started." />}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f8ff' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, color: '#1f2937' },
  createBtn: {
    backgroundColor: '#3b5bfd',
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e9f3',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e6e9f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  cardSub: { color: '#6b7280', fontSize: 14 },
  joinBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#eaf0ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  viewBtn: { backgroundColor: '#3b5bfd' },
  pendingBtn: { backgroundColor: '#fff8e1', borderWidth: 1, borderColor: '#ffeeba' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '90%', maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  chatModalContent: { backgroundColor: '#fff', borderRadius: 24, width: '95%', height: '90%', overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', backgroundColor: '#fff' },
  chatTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  chatSubtitle: { color: '#6b7280', fontSize: 13 },
  messageList: { flex: 1, padding: 16, backgroundColor: '#f9fafb' },
  messageRow: { marginBottom: 16, flexDirection: 'row' },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageBubble: { padding: 14, borderRadius: 20 },
  messageBubbleMe: { backgroundColor: '#3b5bfd', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e6e9f3' },
  messageSender: { fontSize: 11, color: '#9ca3af', marginBottom: 4, fontWeight: '600', marginLeft: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  messageTextMe: { color: '#fff' },
  messageTextOther: { color: '#374151' },
  messageImage: { width: 220, height: 160, borderRadius: 12, marginBottom: 6 },
  messageAvatar: { width: 32, height: 32, borderRadius: 16 },
  inputRow: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', alignItems: 'center', backgroundColor: '#fff' },
  chatInput: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, marginRight: 10, borderWidth: 1, borderColor: '#e5e7eb', fontSize: 15 },
  sendBtn: { backgroundColor: '#3b5bfd', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  chatFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' },
  cancelBtn: { flex: 1, backgroundColor: '#eaf0ff', borderRadius: 16, alignItems: 'center', paddingVertical: 14 },
  cancelBtnText: { color: '#3b5bfd' },
  submitBtn: { flex: 1, backgroundColor: '#3b5bfd', borderRadius: 16, alignItems: 'center', paddingVertical: 14 },
  pendingSection: { backgroundColor: '#fff8e1', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#ffeeba' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: '#b45309' },
  pendingCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  approveBtn: { backgroundColor: '#d1fae5', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  rejectBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  iconBtn: { padding: 8, marginRight: 4 },
  previewContainer: { padding: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb' },
  previewImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  removePreview: { backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 8, left: 64 },
  fileAttachment: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, marginBottom: 6 },
  fileName: { marginLeft: 8, fontSize: 14, fontWeight: '500' },
  fileNameMe: { color: '#fff' },
  fileNameOther: { color: '#3b5bfd' },
  filePreview: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e6e9f3' },
  filePreviewName: { marginLeft: 10, fontSize: 14, color: '#1f2937', flex: 1, fontWeight: '500' },
  avatarRow: { flexDirection: 'row', marginTop: 12, marginBottom: 4 },
  avatarBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e0e7ff', justifyContent: 'center', alignItems: 'center', marginRight: -8, borderWidth: 2, borderColor: '#fff' },
  avatarText: { fontSize: 10, color: '#3b5bfd', fontWeight: '700' },
  moreBubble: { backgroundColor: '#f3f4f6' },
  moreText: { color: '#6b7280' },
  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20 },
  memberAvatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3b5bfd', justifyContent: 'center', alignItems: 'center' },
  memberName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  memberEmail: { fontSize: 12, color: '#6b7280' },
});
