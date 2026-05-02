import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { API_BASE_URL } from '../api/client';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
import { EmptyState } from '../components/ui';

type Teacher = {
    _id: string; // or email as id
    email: string;
    name: string;
    designation: string;
    school: string;
    status: string;
    photoUrl?: string;
};

export default function AdminTeacherListScreen() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeachers();
    }, []);

    async function fetchTeachers() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/teachers`);
            const data = await res.json();
            setTeachers(data);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch teachers');
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(email: string, status: 'approved' | 'rejected') {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/teachers/${encodeURIComponent(email)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                Alert.alert('Success', `Teacher ${status} successfully`);
                fetchTeachers(); // Refresh list
            } else {
                Alert.alert('Error', 'Failed to update status');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error');
        }
    }

    async function deleteTeacher(email: string) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/teachers/${encodeURIComponent(email)}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                Alert.alert('Success', 'Teacher account removed');
                fetchTeachers();
            } else {
                Alert.alert('Error', 'Failed to remove teacher');
            }
        } catch (e) {
            Alert.alert('Error', 'Network error');
        }
    }

    const renderItem = ({ item }: { item: Teacher }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.detail}>{item.email}</Text>
                    <Text style={styles.detail}>{item.school}</Text>
                    <View style={[styles.badge,
                    item.status === 'approved' ? styles.badgeApproved :
                        item.status === 'rejected' ? styles.badgeRejected : styles.badgePending
                    ]}>
                        <Text style={[styles.badgeText,
                        item.status === 'approved' ? styles.textApproved :
                            item.status === 'rejected' ? styles.textRejected : styles.textPending
                        ]}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                {/* Always show delete for Approved/Rejected, or even Pending if we want to hard delete */}
                {/* Allow delete for all statuses if needed, or stick to current logic.
                    Current logic: item.status !== 'pending'
                    But maybe pending ones should be deletable too? The user said "trash can icon" so they likely see it. 
                    If they want to delete pending, we should probably allow it.
                    Let's KEEP the condition consistent with what they see (which implies Approved/Rejected are the ones with icons).
                 */}
                {true && ( // logic seems to be: Approved/Rejected have trash. Pending have Approve/Reject buttons. 
                    // If we want trash for Pending too, we can enable it. 
                    // For now, let's just FIX the click handler.
                    <TouchableOpacity style={{ padding: 8 }} onPress={() => {
                        if (Platform.OS === 'web') {
                            const ok = window.confirm('Are you sure you want to remove this teacher? This cannot be undone.');
                            if (ok) deleteTeacher(item.email);
                        } else {
                            Alert.alert('Confirm Delete', 'Are you sure you want to remove this teacher? This cannot be undone.', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Delete', style: 'destructive', onPress: () => deleteTeacher(item.email) }
                            ]);
                        }
                    }}>
                        <Ionicons name="trash-outline" size={24} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>

            {item.status === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnReject]}
                        onPress={() => updateStatus(item.email, 'rejected')}
                    >
                        <Text style={styles.btnTextReject}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnApprove]}
                        onPress={() => updateStatus(item.email, 'approved')}
                    >
                        <Text style={styles.btnTextApprove}>Approve</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={{ padding: 16, gap: 16 }}>
                    <SkeletonLoader variant="card" height={120} />
                    <SkeletonLoader variant="card" height={120} />
                    <SkeletonLoader variant="card" height={120} />
                </View>
            ) : (
                <FlatList
                    data={teachers}
                    renderItem={renderItem}
                    keyExtractor={item => item.email}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={<EmptyState title="No teachers found" />}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f8ff' },
    list: { padding: 16 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
    avatarPlaceholder: {
        width: 50, height: 50, borderRadius: 25, marginRight: 16,
        backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center'
    },
    avatarText: { fontSize: 20, fontWeight: 'bold', color: '#666' },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    detail: { fontSize: 13, color: '#666' },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    badgePending: { backgroundColor: '#FFF3E0' },
    badgeApproved: { backgroundColor: '#E8F5E9' },
    badgeRejected: { backgroundColor: '#FFEBEE' },
    textPending: { color: '#FF9800', fontSize: 10, fontWeight: 'bold' },
    textApproved: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' },
    textRejected: { color: '#F44336', fontSize: 10, fontWeight: 'bold' },

    actions: {
        flexDirection: 'row',
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
        justifyContent: 'flex-end',
        gap: 12,
    },
    btn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    btnReject: { backgroundColor: '#FFEBEE' },
    btnApprove: { backgroundColor: '#E8F5E9' },
    btnTextReject: { color: '#D32F2F', fontWeight: '600' },
    btnTextApprove: { color: '#388E3C', fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});
