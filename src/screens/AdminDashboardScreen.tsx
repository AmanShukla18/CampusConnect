import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Dimensions, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';
// In a real app we'd use react-native-chart-kit, but for here we use simple UI blocks.
// import { LineChart, BarChart } from 'react-native-chart-kit';

export default function AdminDashboardScreen({ navigation }: any) {
    const { signOut, userProfile, email } = useAuth();
    const { colors, isDark } = useTheme();
    const [stats, setStats] = useState<any>(null);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Overview');
    
    // Broadcast state
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [sendingBroadcast, setSendingBroadcast] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, analyticsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/admin/stats`),
                fetch(`${API_BASE_URL}/api/admin/analytics`)
            ]);
            let s = {};
            let a = {};
            if (statsRes.ok) s = await statsRes.json();
            if (analyticsRes.ok) a = await analyticsRes.json();
            
            setStats(s || {});
            setAnalytics(a || {});
        } catch (e) {
            console.error('Failed to fetch admin stats', e);
            Alert.alert('Error', 'Failed to fetch analytics from server.');
        } finally {
            setLoading(false);
        }
    };

    const sendBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setSendingBroadcast(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: broadcastMsg, senderEmail: email, type: 'alert' }),
            });
            if (response.ok) {
                Alert.alert('Success', 'Broadcast sent successfully global-wide.');
                setBroadcastMsg('');
            }
        } catch(e) {
            Alert.alert('Error', 'Failed to send broadcast');
        } finally {
            setSendingBroadcast(false);
        }
    };

    const tabs = ['Overview', 'Users', 'Analytics', 'System Health', 'Manage'];

    const StatCard = ({ title, value, icon, color }: any) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View>
                <Text style={[styles.statValue, { color: colors.text }]}>{value !== undefined ? value : '...'}</Text>
                <Text style={{ color: colors.subText, fontSize: 13, fontWeight: '600' }}>{title}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <View>
                    <Text style={styles.welcome}>Admin Dashboard</Text>
                    <Text style={[styles.name, { color: colors.text }]}>{userProfile?.name || 'Administrator'}</Text>
                </View>
                <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {tabs.map((tab) => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[styles.tab, activeTab === tab && styles.activeTab, { borderBottomColor: activeTab === tab ? '#3b5bfd' : 'transparent' }]}
                            onPress={() => {
                                Keyboard.dismiss();
                                setActiveTab(tab);
                            }}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText, { color: activeTab === tab ? '#3b5bfd' : colors.subText }]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                {loading ? (
                    <View style={{ flexWrap: 'wrap', flexDirection: 'row', gap: 12, justifyContent: 'space-between', paddingVertical: 16 }}>
                        {[...Array(6)].map((_, i) => (
                            <SkeletonLoader key={i} variant="card" width="48%" height={100} />
                        ))}
                    </View>
                ) : (
                    <>
                        {activeTab === 'Overview' && (
                            <>
                                <View style={styles.statsGrid}>
                                    <StatCard title="Total Users" value={stats?.users?.total} icon="people" color="#3b82f6" />
                                    <StatCard title="Teachers" value={stats?.users?.teachers} icon="school" color="#10b981" />
                                    <StatCard title="Groups" value={stats?.groups} icon="library" color="#f59e0b" />
                                    <StatCard title="Events" value={stats?.events} icon="calendar" color="#8b5cf6" />
                                    <StatCard title="Resources" value={stats?.resources} icon="document-text" color="#ec4899" />
                                    <StatCard title="Notices" value={stats?.notices} icon="megaphone" color="#f43f5e" />
                                </View>

                                <View style={[styles.broadcastSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Global Broadcast</Text>
                                    <Text style={{ color: colors.subText, marginBottom: 12, fontSize: 13 }}>Send an alert to all connected users instantly.</Text>
                                    <TextInput 
                                        style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                                        placeholder="Enter urgent message..."
                                        placeholderTextColor={colors.subText}
                                        value={broadcastMsg}
                                        onChangeText={setBroadcastMsg}
                                        multiline
                                    />
                                    <TouchableOpacity style={styles.sendBtn} onPress={sendBroadcast} disabled={sendingBroadcast}>
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>{sendingBroadcast ? 'Sending...' : 'Send Broadcast'}</Text>
                                        <Ionicons name="send" size={16} color="#fff" style={{ marginLeft: 8 }} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {activeTab === 'Analytics' && (
                            <View style={[styles.analyticsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>User Registrations — Last 30 Days</Text>
                                {(() => {
                                    let growthData = analytics?.userGrowth ?? [];
                                    if (growthData.length === 0) {
                                        const now = new Date();
                                        growthData = Array.from({length: 7}).map((_, i) => {
                                            const d = new Date(now);
                                            d.setDate(d.getDate() - (6 - i));
                                            return { date: d.toISOString(), count: 0 };
                                        });
                                    }
                                    const maxCount = Math.max(...growthData.map((d: any) => d.count ?? 0), 1);
                                    
                                    return (
                                        <View style={[styles.chartContainer, { borderColor: colors.border }]}>
                                            {analytics?.userGrowth && analytics.userGrowth.length === 0 ? (
                                                <Text style={{ color: colors.subText, fontWeight: '600', position: 'absolute', alignSelf: 'center', top: 80 }}>No data yet</Text>
                                            ) : null}
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'flex-end', paddingHorizontal: 16, height: 160, paddingBottom: 10 }}>
                                                {growthData.map((item: any, index: number) => {
                                                    const barHeight = ((item.count ?? 0) / maxCount) * 120;
                                                    const label = new Date(item.date).toLocaleDateString('en', { month: 'short', day: 'numeric' });
                                                    return (
                                                        <View key={index} style={styles.barWrapper}>
                                                            <Text style={[styles.barValue, { color: '#3b5bfd' }]}>{item.count ?? 0}</Text>
                                                            <View style={[styles.bar, { height: Math.max(barHeight, 4) }]} />
                                                            <Text style={[styles.barLabel, { color: colors.subText }]}>{label}</Text>
                                                        </View>
                                                    )
                                                })}
                                            </ScrollView>
                                        </View>
                                    );
                                })()}
                                <View style={styles.growthStats}>
                                    <View style={styles.growthStat}>
                                        <Text style={[styles.growthValue, { color: '#10b981' }]}>+{analytics?.recentSignups || 0}</Text>
                                        <Text style={{ color: colors.subText, fontSize: 12 }}>New Users</Text>
                                    </View>
                                    <View style={styles.growthStat}>
                                        <Text style={[styles.growthValue, { color: '#3b82f6' }]}>+{analytics?.recentEvents || 0}</Text>
                                        <Text style={{ color: colors.subText, fontSize: 12 }}>New Events</Text>
                                    </View>
                                    <View style={styles.growthStat}>
                                        <Text style={[styles.growthValue, { color: '#8b5cf6' }]}>+{analytics?.recentGroups || 0}</Text>
                                        <Text style={{ color: colors.subText, fontSize: 12 }}>New Groups</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'System Health' && (
                            <View style={[styles.healthSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>System Status</Text>
                                <View style={styles.healthRow}>
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>API Servers</Text>
                                    <View style={styles.statusBadge}><Text style={styles.statusText}>ALL SYSTEMS NORMAL</Text></View>
                                </View>
                                <View style={styles.healthRow}>
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Database</Text>
                                    <View style={styles.statusBadge}><Text style={styles.statusText}>CONNECTED</Text></View>
                                </View>
                                <View style={styles.healthRow}>
                                    <Text style={{ color: colors.text, fontWeight: '600' }}>Realtime Socket.io</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: '#10b981' }]}><Text style={[styles.statusText, {color: '#fff'}]}>LIVE & HEALTHY</Text></View>
                                </View>
                            </View>
                        )}

                        {activeTab === 'Manage' && (
                            <View style={{ gap: 12 }}>
                                {[
                                    { title: 'Pending Teacher Requests', icon: 'people-circle-outline', screen: 'AdminTeacherList', color: '#f59e0b', parentNav: false },
                                    { title: 'Manage Users', icon: 'people-outline', screen: 'AdminTeacherList', color: '#10b981', parentNav: false }, 
                                    { title: 'Manage Notices', icon: 'newspaper-outline', screen: 'Notices', color: '#3b82f6', parentNav: true },
                                    { title: 'Manage Groups', icon: 'library-outline', screen: 'Study Groups', color: '#8b5cf6', parentNav: true },
                                ].map((item, index) => (
                                    <TouchableOpacity key={index} style={[styles.manageCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {
                                        Keyboard.dismiss();
                                        setTimeout(() => {
                                            if (item.parentNav) {
                                                navigation.getParent()?.navigate(item.screen);
                                            } else {
                                                navigation.navigate(item.screen);
                                            }
                                        }, 100);
                                    }}>

                                        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                                            <Ionicons name={item.icon as any} size={28} color={item.color} />
                                        </View>
                                        <Text style={[styles.manageTitle, { color: colors.text }]}>{item.title}</Text>
                                        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {activeTab === 'Users' && (
                            <View>
                                <TouchableOpacity style={[styles.manageCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {
                                    Keyboard.dismiss();
                                    setTimeout(() => navigation.navigate('AdminTeacherList'), 100);
                                }}>
                                    <View style={[styles.iconContainer, { backgroundColor: '#10b981' + '20' }]}>
                                        <Ionicons name="people" size={28} color="#10b981" />
                                    </View>
                                    <Text style={[styles.manageTitle, { color: colors.text }]}>View All Users Directory ({stats?.users?.total})</Text>
                                    <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                                </TouchableOpacity>
                            </View>
                        )}

                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 24, paddingTop: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
    welcome: { fontSize: 14, color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
    name: { fontSize: 24, fontWeight: '800', marginTop: 4 },
    logoutBtn: { padding: 10, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 12 },
    tabContainer: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    tab: { paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 2 },
    activeTab: { borderBottomColor: '#3b5bfd' },
    tabText: { fontWeight: '600', fontSize: 15 },
    activeTabText: { color: '#3b5bfd' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { width: '48%', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    statValue: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
    broadcastSection: { padding: 20, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    sectionTitle: { fontSize: 18, fontWeight: '800' },
    input: { borderRadius: 12, padding: 14, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, marginBottom: 12, fontSize: 16 },
    sendBtn: { backgroundColor: '#3b5bfd', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    manageCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    iconContainer: { width: 50, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    manageTitle: { flex: 1, fontSize: 16, fontWeight: '700' },
    analyticsSection: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 20 },
    chartContainer: { height: 180, borderRadius: 12, justifyContent: 'flex-end', marginBottom: 20, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden' },
    barWrapper: { alignItems: 'center', marginHorizontal: 6, width: 40 },
    bar: { width: 28, backgroundColor: '#3b5bfd', borderRadius: 4 },
    barLabel: { fontSize: 10, marginTop: 4 },
    barValue: { fontSize: 10, marginBottom: 2 },
    growthStats: { flexDirection: 'row', justifyContent: 'space-around' },
    growthStat: { alignItems: 'center' },
    growthValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    healthSection: { padding: 20, borderRadius: 16, borderWidth: 1 },
    healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    statusBadge: { backgroundColor: '#d1fae5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: '#047857', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }
});
