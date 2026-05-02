// src/screens/GroupChatScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { API_BASE_URL } from '../api/client';
import { TabBar, Input, Button, Avatar, FAB, EmptyState, SkeletonLoader, BottomSheet } from '../components/ui';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { formatRelativeTime, formatFullDate } from '../utils/dateUtils';

type GroupData = any; // Will structure properly

export default function GroupChatScreen({ route, navigation }: any) {
  const { groupId, groupName } = route.params;
  const { email, userProfile } = useAuth();
  const { theme } = useTheme();
  const { socket } = useSocket();

  const [activeTab, setActiveTab] = useState('chat');
  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);

  // Chat State
  const [messageText, setMessageText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const headerRight = () => {
      const isCreator = group?.createdByEmail === email;
      const isGlobalAdmin = userProfile?.role === 'admin';
      return (
        <View style={{ flexDirection: 'row', gap: 12, marginRight: 8 }}>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Leave Group',
              'Leave this group? You will need to request to join again.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Leave', style: 'destructive', onPress: handleLeave }
              ]
            );
          }}>
            <Ionicons name="exit-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
          {(isCreator || isGlobalAdmin) && (
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Delete Group',
                'Are you sure? This will delete all messages and data permanently.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: handleDelete }
                ]
              );
            }}>
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      );
    };

    navigation.setOptions({ 
      title: groupName || 'Group Chat',
      headerRight: group ? headerRight : undefined
    });
    fetchGroupDetails();

    if (socket) {
      socket.on('group:update', (updated: any) => {
        if (updated._id === groupId) setGroup(updated);
      });
      return () => {
        socket.off('group:update');
      };
    }
  }, [groupId, socket]);

  const fetchGroupDetails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data);
      }
    } catch (e) {
      console.warn('Failed to fetch group', e);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => {
    if (userProfile?.role === 'admin') return true;
    if (group?.admins?.includes(email)) return true;
    if (group?.createdByEmail === email) return true;
    return false;
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !email) return;
    setUploading(true);
    try {
      await fetch(`${API_BASE_URL}/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: email, content: messageText }),
      });
      setMessageText('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setUploading(false);
    }
  };

  const markAttendance = async (sessionId: string) => {
    if (!email) return;
    try {
      await fetch(`${API_BASE_URL}/api/groups/${groupId}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userAction: 'join', userEmail: email }),
      });
    } catch (e) {
      console.warn('Failed to mark attendance', e);
    }
  };

  const handlePromote = async (targetEmail: string) => {
    const backupGroup = { ...group };
    setGroup((prev: any) => prev ? { ...prev, admins: [...(prev.admins ?? []), targetEmail] } : prev);
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, requesterEmail: email })
      });
      if (!res.ok) throw new Error('Failed to promote');
    } catch (e) {
      setGroup(backupGroup);
      Alert.alert('Error', 'Failed to promote member.');
    }
  };

  const handleDemote = async (targetEmail: string) => {
    const backupGroup = { ...group };
    setGroup((prev: any) => prev ? { ...prev, admins: (prev.admins ?? []).filter((a: string) => a !== targetEmail) } : prev);
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/demote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, requesterEmail: email })
      });
      if (!res.ok) throw new Error('Failed to demote');
    } catch (e) {
      setGroup(backupGroup);
      Alert.alert('Error', 'Failed to demote member.');
    }
  };

  const handleRemove = async (targetEmail: string) => {
    const backupGroup = { ...group };
    setGroup((prev: any) => prev ? { ...prev, members: (prev.members ?? []).filter((m: any) => typeof m === 'string' ? m !== targetEmail : m.email !== targetEmail) } : prev);
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${encodeURIComponent(targetEmail)}?requesterEmail=${encodeURIComponent(email ?? '')}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove');
    } catch (e) {
      setGroup(backupGroup);
      Alert.alert('Error', 'Failed to remove member.');
    }
  };

  const handleLeave = async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to leave group.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred.');
    }
  };

  const handleDelete = async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}?requester=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to delete group.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred.');
    }
  };

  const processMemberAction = (item: any) => {
    if (!isAdmin()) return; // Must be admin
    
    const targetEmail = item.email || item;
    const isMe = targetEmail === email;
    if (isMe) return; // Can't act on yourself here
    
    const isGroupCreator = group?.createdByEmail === email;
    const isGlobalAdmin = userProfile?.role === 'admin';
    const targetIsAdmin = (group?.admins ?? []).includes(targetEmail);
    const targetIsCreator = group?.createdByEmail === targetEmail;
    
    if (targetIsCreator && !isGlobalAdmin) return; // Can't touch creator

    const options: any[] = [];
    
    if (isGroupCreator || isGlobalAdmin) {
      if (targetIsAdmin) {
        options.push({ text: 'Demote to Member', onPress: () => handleDemote(targetEmail) });
      } else {
        options.push({ text: 'Promote to Admin', onPress: () => handlePromote(targetEmail) });
      }
    }
    
    options.push({ text: 'Remove from Group', style: 'destructive', onPress: () => handleRemove(targetEmail) });
    options.push({ text: 'Cancel', style: 'cancel' });
    
    Alert.alert('Manage Member', `What would you like to do with ${item.name || targetEmail}?`, options);
  };

  const handleJoinRequest = async (targetEmail: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/join-requests/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, requesterEmail: email })
      });
      if (!res.ok) throw new Error(`Failed to ${action} request`);
      
      // Optimistic update
      setGroup((prev: any) => {
        if (!prev) return prev;
        const newReqs = (prev.joinRequests ?? []).filter((r: any) => typeof r === 'string' ? r !== targetEmail : r.email !== targetEmail);
        let newMembers = prev.members;
        if (action === 'approve') {
          // just push email string optimistically
          newMembers = [...(prev.members ?? []), targetEmail];
        }
        return { ...prev, joinRequests: newReqs, members: newMembers };
      });
    } catch (e) {
      Alert.alert('Error', `Failed to ${action} join request.`);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, optionIndex })
      });
      if (!res.ok) throw new Error('Failed to vote');
    } catch (e) {
      Alert.alert('Error', 'Failed to submit vote.');
    }
  };

  const handleTextChange = (text: string) => {
    setMessageText(text);
    const match = text.match(/@(\w*)$/);
    if (match) {
      setShowMentions(true);
      setMentionSearch(match[1].toLowerCase());
    } else {
      setShowMentions(false);
    }
  };

  const renderMentions = () => {
    if (!showMentions || !group?.members) return null;
    const filtered = group.members.filter((m: any) => {
      const name = m.name || m.email || m;
      return typeof name === 'string' && name.toLowerCase().includes(mentionSearch);
    });
    if (filtered.length === 0) return null;

    return (
      <View style={[styles.mentionsContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.cardBorder }]}>
        <FlatList
          data={filtered}
          keyExtractor={m => m._id || m.email || m}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 150 }}
          renderItem={({ item }) => {
            const name = item.name || item.email || item;
            return (
              <TouchableOpacity
                style={styles.mentionItem}
                onPress={() => {
                  const newText = messageText.replace(/@(\w*)$/, `@${name} `);
                  setMessageText(newText);
                  setShowMentions(false);
                }}
              >
                <Avatar name={name} src={item.photoUrl} size="sm" style={{ marginRight: 8 }} />
                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const renderMessageContent = (content: string, isMe: boolean) => {
    if (!content) return null;
    const parts = content.split(/(@\S+)/g);
    return (
      <Text style={{ color: isMe ? '#FFF' : theme.colors.text }}>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return (
              <Text key={i} style={{ color: isMe ? '#e0e7ff' : theme.colors.primary, fontWeight: 'bold' }}>
                {part}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <SkeletonLoader variant="list-item" height={80} style={{ marginBottom: 12 }} />
          <SkeletonLoader variant="list-item" height={80} style={{ marginBottom: 12 }} />
          <SkeletonLoader variant="list-item" height={80} />
        </View>
      );
    }

    if (!group) return <EmptyState variant="error" title="Group Not Found" />;

    switch (activeTab) {
      case 'chat':
        return (
          <View style={{ flex: 1 }}>
            <FlatList
              ref={flatListRef}
              data={(group?.messages ?? [])}
              keyExtractor={(m) => m._id}
              contentContainerStyle={styles.chatList}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              renderItem={({ item }) => {
                const isMe = item.sender === email;
                return (
                  <View style={[styles.messageRow, isMe ? styles.messageMe : styles.messageOther]}>
                    {!isMe && (
                      <Avatar 
                        name={item.senderName || item.sender} 
                        src={item.senderPhoto} 
                        size="sm" 
                        style={{ marginRight: 8, alignSelf: 'flex-end' }} 
                      />
                    )}
                    <View style={styles.messageContentWrapper}>
                      {!isMe && <Text style={[styles.senderName, { color: theme.colors.subText, fontSize: theme.typography.size.xs }]}>{item.senderName || item.sender}</Text>}
                      <View style={[
                        styles.messageBubble, 
                        isMe ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.card },
                        { borderRadius: theme.borderRadius.lg }
                      ]}>
                        {renderMessageContent(item.content, isMe)}
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<EmptyState title="No messages yet" subtitle="Be the first to say hi!" />}
            />
            {renderMentions()}
            <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.cardBorder }]}>
              <TextInput
                value={messageText}
                onChangeText={handleTextChange}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.subText}
                style={[styles.textInput, { color: theme.colors.text, backgroundColor: theme.colors.inputBg, borderRadius: theme.borderRadius.full }]}
              />
              <TouchableOpacity onPress={sendMessage} style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'sessions':
        return (
          <View style={{ flex: 1 }}>
            <FlatList
              data={(group?.sessions ?? [])}
              keyExtractor={(s) => s._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const attended = (item?.attendees ?? []).includes(email);
                const isLive = item?.status === 'live';
                const sessionDate = item?.date ? formatFullDate(item.date) : 'No date set';
                return (
                  <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, borderColor: theme.colors.cardBorder }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={[styles.itemTitle, { color: theme.colors.text, fontSize: theme.typography.size.lg, marginBottom: 0 }]}>{item?.title}</Text>
                      {isLive && (
                        <View style={{ backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: theme.colors.subText }}>Status: {(item?.status ?? 'UPCOMING').toUpperCase()}</Text>
                    <Text style={{ color: theme.colors.subText, marginTop: 4 }}>Date: {sessionDate}</Text>
                    <Text style={{ color: theme.colors.subText, marginTop: 4 }}>Host: {item?.hostUser}</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.cardBorder }}>
                      <Text style={{ color: theme.colors.text, fontSize: 13, fontWeight: '600' }}>
                        <Ionicons name="people" size={14} color={theme.colors.subText} /> Attendance: {(item?.attendees ?? []).length}
                      </Text>
                      
                      {isLive && !attended && (
                        <TouchableOpacity 
                          style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.sm }}
                          onPress={() => markAttendance(item._id)}
                        >
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>Mark Present</Text>
                        </TouchableOpacity>
                      )}
                      {(item?.status === 'completed' || attended) && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {attended ? (
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                          ) : (
                            <Ionicons name="close-circle" size={16} color="#ef4444" />
                          )}
                          <Text style={{ color: attended ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 'bold' }}>
                            {attended ? 'Attended' : 'Missed'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={<EmptyState icon={<Ionicons name="calendar-outline" size={48} color={theme.colors.subText} />} title="No Sessions" subtitle="Schedule a live study session here." />}
            />
            {isAdmin() && (
              <FAB icon={<Ionicons name="add" size={24} color="#FFF" />} onPress={() => {}} />
            )}
          </View>
        );
      case 'notes':
        return (
          <View style={{ flex: 1 }}>
             <FlatList
              data={(group?.notes ?? [])}
              keyExtractor={(n) => n._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => {
                const tagsRaw = item?.tags ?? [];
                // if it's an array of strings
                const tags = Array.isArray(tagsRaw) ? tagsRaw.join(', ') : '';
                const editedAt = item?.lastUpdatedAt ? formatRelativeTime(item.lastUpdatedAt) : '';
                return (
                  <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, borderColor: theme.colors.cardBorder }]}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                       <Text style={[styles.itemTitle, { color: theme.colors.text, fontSize: theme.typography.size.lg }]}>{item?.title}</Text>
                       {editedAt ? <Text style={{ color: theme.colors.subText, fontSize: 12 }}>{editedAt}</Text> : null}
                    </View>
                    {tags ? <Text style={{ color: theme.colors.primary, fontSize: 12, marginBottom: 6 }}>{tags}</Text> : null}
                    <Text style={{ color: theme.colors.subText }} numberOfLines={2}>{item?.content ?? ''}</Text>
                  </View>
                );
              }}
              ListEmptyComponent={<EmptyState icon={<Ionicons name="document-text-outline" size={48} color={theme.colors.subText} />} title="No Shared Notes" subtitle="Collaborate on notes with your group." />}
            />
             <FAB icon={<Ionicons name="add" size={24} color="#FFF" />} onPress={() => {}} />
          </View>
        );
      case 'polls':
        return (
          <View style={{ flex: 1 }}>
             <FlatList
              data={(group?.polls ?? [])}
              keyExtractor={(p) => p._id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <View style={[styles.itemCard, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, borderColor: theme.colors.cardBorder }]}>
                  {item?.question && <Text style={[styles.itemTitle, { color: theme.colors.text, fontSize: theme.typography.size.lg, fontWeight: '700' }]}>{item.question}</Text>}
                  {(item?.options ?? []).map((opt: any, idx: number) => {
                    const totalVotes = (item?.options ?? []).reduce((sum: number, o: any) => sum + (o?.votes ?? []).length, 0);
                    const optVotes = (opt?.votes ?? []).length;
                    const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                    return (
                      <TouchableOpacity 
                        key={idx} 
                        style={[styles.pollOption, { backgroundColor: theme.colors.inputBg, borderRadius: theme.borderRadius.sm }]}
                        onPress={() => handleVote(item._id, idx)}
                      >
                        <Text style={{ color: theme.colors.text, flex: 1 }}>{opt?.text}</Text>
                        <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{percent}% ({optVotes})</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              ListEmptyComponent={<EmptyState icon={<Ionicons name="stats-chart-outline" size={48} color={theme.colors.subText} />} title="No Polls" subtitle="Ask the group a question." />}
            />
             <FAB icon={<Ionicons name="add" size={24} color="#FFF" />} onPress={() => {}} />
          </View>
        );
      case 'members':
        return (
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {isAdmin() && (group?.joinRequests ?? []).length > 0 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 }}>Join Requests ({(group?.joinRequests ?? []).length})</Text>
                {(group?.joinRequests ?? []).map((reqItem: any, idx: number) => {
                  const reqEmail = reqItem.email || reqItem;
                  const reqName = reqItem.name || reqEmail;
                  return (
                    <View key={idx} style={[styles.memberRow, { borderBottomColor: theme.colors.cardBorder, justifyContent: 'space-between' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Avatar name={reqName} src={reqItem.photoUrl} size="md" />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ color: theme.colors.text, fontWeight: '600' }} numberOfLines={1}>{reqName}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                         <TouchableOpacity onPress={() => handleJoinRequest(reqEmail, 'approve')} style={{ backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.sm }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Approve</Text>
                         </TouchableOpacity>
                         <TouchableOpacity onPress={() => handleJoinRequest(reqEmail, 'reject')} style={{ backgroundColor: '#ef4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.sm }}>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Reject</Text>
                         </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 12 }}>Members ({(group?.members ?? []).length})</Text>
            {(group?.members ?? []).map((item: any, idx: number) => {
              const memberName = item.name || item.email || item;
              const isGroupAdmin = (group?.admins ?? []).includes(item.email || item);
              const isCreator = group?.createdByEmail === (item.email || item);
              const displayRole = isCreator ? 'Creator' : (isGroupAdmin ? 'Admin' : null);
              return (
                <TouchableOpacity 
                  key={idx}
                  style={[styles.memberRow, { borderBottomColor: theme.colors.cardBorder }]}
                  onPress={() => processMemberAction(item)}
                  activeOpacity={isAdmin() ? 0.7 : 1}
                >
                  <Avatar name={memberName} src={item.photoUrl} size="md" />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{memberName}</Text>
                    {displayRole && (
                       <Text style={{ color: theme.colors.primary, fontSize: 12, fontWeight: 'bold' }}>{displayRole}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      default: return null;
    }
  };

  const tabs = [
    { id: 'chat', label: 'Chat' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'notes', label: 'Notes' },
    { id: 'polls', label: 'Polls' },
    { id: 'members', label: 'Members' },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TabBar 
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
      />
      {renderTabContent()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 16,
  },
  chatList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  messageMe: {
    alignSelf: 'flex-end',
  },
  messageOther: {
    alignSelf: 'flex-start',
  },
  messageContentWrapper: {
    flex: 1,
  },
  senderName: {
    marginBottom: 2,
    marginLeft: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mentionsContainer: {
    maxHeight: 150,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc'
  },
  itemCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pollOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  }
});
