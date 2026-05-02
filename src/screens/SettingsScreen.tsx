import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image, Modal, TextInput, Alert, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const { email, userProfile, signOut } = useAuth();
  const navigation = useNavigation() as any;
  const { isDark, toggleTheme, colors } = useTheme();
  const [notify, setNotify] = useState(true);
  const [fontScale, setFontScale] = useState(1);
  const [publicProfile, setPublicProfile] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Password Change State
  const [pwdModalVisible, setPwdModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const n = await AsyncStorage.getItem('settings_notify');
      if (n !== null) setNotify(n === 'true');
      const f = await AsyncStorage.getItem('settings_fontScale');
      if (f !== null) setFontScale(parseFloat(f));
      const p = await AsyncStorage.getItem('settings_publicProfile');
      if (p !== null) setPublicProfile(p === 'true');
    } catch (e) {
      console.error('Failed to load settings', e);
    }
  };

  const toggleNotify = async (val: boolean) => {
    setNotify(val);
    await AsyncStorage.setItem('settings_notify', String(val));
  };
  
  const togglePublicProfile = async (val: boolean) => {
    setPublicProfile(val);
    await AsyncStorage.setItem('settings_publicProfile', String(val));
    // Optionally update backend
  };

  const handleExportData = async () => {
    if (!email) return;
    setExporting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/export?email=${email}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      const fileUri = `${(FileSystem as any).documentDirectory || ''}export_${email}.json`;
      await (FileSystem as any).writeAsStringAsync(fileUri, JSON.stringify(data, null, 2));
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Exported', 'Data exported but sharing is not available on this device.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: async () => {
            if (!email) return;
            setDeleting(true);
            try {
              const res = await fetch(`${API_BASE_URL}/api/user?email=${email}`, { method: 'DELETE' });
              if (res.ok) {
                Alert.alert('Account Deleted', 'Your account has been successfully deleted. We are sorry to see you go.', [
                  { text: 'OK', onPress: () => { signOut(); navigation.replace('Login'); } }
                ]);
              } else {
                throw new Error('Failed to delete account');
              }
            } catch(e: any) {
              Alert.alert('Error', e.message || 'Failed to delete account');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Password changed successfully');
        setPwdModalVisible(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Error', data.error || 'Failed to change password');
      }
    } catch (e) {
      Alert.alert('Error', 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const SettingsRow = ({ icon, label, onPress, value, type = 'chevron', color = '#3b5bfd' }: any) => (
    <TouchableOpacity 
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={onPress} 
      activeOpacity={type === 'switch' ? 1 : 0.7}
      disabled={type === 'switch'}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={22} color={color} style={{ marginRight: 12 }} />
        <Text style={[styles.rowLabel, { color: colors.text, fontSize: 16 * fontScale }]}>{label}</Text>
      </View>
      {type === 'chevron' && <Ionicons name="chevron-forward" size={20} color={colors.subText} />}
      {type === 'switch' && <Switch value={value} onValueChange={onPress} trackColor={{ false: '#d1d5db', true: '#3b5bfd' }} thumbColor="#fff" />}
      {type === 'value' && <Text style={{ color: colors.subText }}>{value}</Text>}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.subText }]}>{title}</Text>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

      {/* Profile summary */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {userProfile?.photoUrl ? (
          <Image source={{ uri: userProfile.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={32} color="#3b5bfd" />
          </View>
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{userProfile?.name || email || 'Guest User'}</Text>
          <Text style={[styles.sub, { color: colors.subText }]}>
            {userProfile?.designation || 'Member'} • {userProfile?.school || 'CampusConnect'}
          </Text>
        </View>
        <TouchableOpacity style={[styles.editBtn, { backgroundColor: isDark ? '#374151' : '#eaf0ff' }]} onPress={() => navigation.navigate('ProfileEdit')}>
          <Text style={{ color: '#3b5bfd', fontWeight: '700' }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* 1. Appearance */}
      <View style={styles.section}>
        <SectionHeader title="Appearance" />
        <SettingsRow icon={isDark ? "sunny-outline" : "moon-outline"} label={isDark ? "Bright Mode" : "Dark Mode"} type="switch" value={isDark} onPress={toggleTheme} />
        {/* Dynamic themes or font scaling can be added here */}
      </View>

      {/* 2. Notifications */}
      <View style={styles.section}>
        <SectionHeader title="Notifications" />
        <SettingsRow icon="notifications-outline" label="Push Notifications" type="switch" value={notify} onPress={toggleNotify} />
        <SettingsRow icon="mail-outline" label="Email Updates" type="switch" value={true} onPress={() => {}} />
      </View>

      {/* 3. Privacy & Security */}
      <View style={styles.section}>
        <SectionHeader title="Privacy & Security" />
        <SettingsRow icon="lock-closed-outline" label="Change Password" onPress={() => setPwdModalVisible(true)} />
        <SettingsRow icon="eye-outline" label="Public Profile" type="switch" value={publicProfile} onPress={togglePublicProfile} />
        <SettingsRow icon="shield-checkmark-outline" label="Two-Factor Authentication" value="Off" type="value" />
      </View>

      {/* 4. Data & Storage */}
      <View style={styles.section}>
        <SectionHeader title="Data & Storage" />
        <SettingsRow icon="download-outline" label={exporting ? "Exporting..." : "Export My Data"} onPress={handleExportData} />
        <SettingsRow icon="trash-bin-outline" label="Clear Cache" value="124 MB" type="value" />
      </View>

      {/* 5. About & Support */}
      <View style={styles.section}>
        <SectionHeader title="About & Support" />
        <SettingsRow icon="help-circle-outline" label="Help Center" onPress={() => Alert.alert('Help Center', 'Redirecting to support portal...')} />
        <SettingsRow icon="document-text-outline" label="Terms of Service" onPress={() => Alert.alert('Terms', 'Redirecting...')} />
        <SettingsRow icon="shield-half-outline" label="Privacy Policy" onPress={() => Alert.alert('Privacy', 'Redirecting...')} />
        <SettingsRow icon="information-circle-outline" label="App Version" value="v2.1.0" type="value" />
      </View>

      {/* 6. Account */}
      <View style={styles.section}>
        <SectionHeader title="Account" />
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2', borderColor: isDark ? '#991b1b' : '#fecaca' }]} onPress={() => { signOut(); navigation.replace('Login'); }}>
          <Text style={{ color: '#ef4444', fontWeight: '800' }}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: isDark ? '#450a0a' : '#fff1f2', borderColor: isDark ? '#7f1d1d' : '#fecdd3', marginTop: 12 }]} onPress={handleDeleteAccount} disabled={deleting}>
          <Text style={{ color: '#e11d48', fontWeight: '800' }}>{deleting ? 'Deleting...' : 'Delete Account Permanently'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Change Password Modal */}
      <Modal visible={pwdModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>

            <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" placeholderTextColor="#6b7280" />

            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" placeholderTextColor="#6b7280" />

            <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#6b7280" />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]} onPress={() => setPwdModalVisible(false)}>
                <Text style={[{ fontWeight: '600', color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#3b5bfd' }]} onPress={handleChangePassword} disabled={loading}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{loading ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, marginTop: 10 },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#e0e7ff' },
  name: { fontWeight: '700', fontSize: 18 },
  sub: { fontSize: 14, marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { marginBottom: 12, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 8 },
  row: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rowLabel: { fontWeight: '600' },
  actionBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16, borderWidth: 1 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 12 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});
