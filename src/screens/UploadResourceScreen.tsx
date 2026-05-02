import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useTheme } from '../context/ThemeContext';

export default function UploadResourceScreen({ navigation }: any) {
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const isTeacher = userProfile?.designation === 'Teacher';

  useEffect(() => {
    // Check if user is a teacher
    if (!isTeacher) {
      Alert.alert(
        'Access Restricted',
        'Only teachers and faculty members can upload resources.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [isTeacher]);

  async function saveResource(url: string) {
    if (!isTeacher) {
      Alert.alert('Access Denied', 'Only teachers can upload resources');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/resources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || url.split('/').pop() || 'Resource',
          subject,
          year,
          url,
          department: userProfile?.school,
          school: userProfile?.school,
        }),
      });

      if (response.ok) {
        Alert.alert('Uploaded', 'Resource added successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to upload resource');
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e.message || 'Could not add resource');
    }
  }

  async function pickAndUpload() {
    if (!isTeacher) {
      Alert.alert('Access Denied', 'Only teachers can upload resources');
      return;
    }

    // Web fallback: ask user to paste a direct URL and submit
    if (Platform.OS === 'web') {
      if (!urlInput) return Alert.alert('Missing URL', 'Paste a direct URL to the file (PDF, etc.)');
      setUploading(true);
      try {
        await saveResource(urlInput);
      } catch (e: any) {
        Alert.alert('Upload failed', e.message || 'Could not add resource');
      } finally {
        setUploading(false);
      }
      return;
    }

    // Native path: use expo-document-picker (compatible with RN 0.81+)
    try {
      const DocumentPicker = await import('expo-document-picker');
      const res = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      setUploading(true);

      // Upload to backend
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || `resource-${Date.now()}`,
        type: asset.mimeType || 'application/octet-stream',
      } as any);

      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        await saveResource(uploadData.url);
      } else {
        Alert.alert('Error', 'Failed to upload file');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    subtitle: { color: colors.subText },
    input: { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
    restrictedTitle: { color: colors.text },
    restrictedText: { color: colors.subText },
  };

  if (!isTeacher) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedIcon}>🔒</Text>
          <Text style={[styles.restrictedTitle, dynamicStyles.restrictedTitle]}>Access Restricted</Text>
          <Text style={[styles.restrictedText, dynamicStyles.restrictedText]}>
            Only teachers and faculty members can upload resources.
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Upload Resource</Text>
      <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Share educational materials with students</Text>
      <TextInput placeholder="Title" placeholderTextColor={colors.subText} value={title} onChangeText={setTitle} style={[styles.input, dynamicStyles.input]} />
      <TextInput placeholder="Subject" placeholderTextColor={colors.subText} value={subject} onChangeText={setSubject} style={[styles.input, dynamicStyles.input]} />
      <TextInput placeholder="Year" placeholderTextColor={colors.subText} value={year} onChangeText={setYear} style={[styles.input, dynamicStyles.input]} />
      {Platform.OS === 'web' ? (
        <>
          <TextInput placeholder="Direct URL to file (PDF)" placeholderTextColor={colors.subText} value={urlInput} onChangeText={setUrlInput} style={[styles.input, dynamicStyles.input]} />
          <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload} disabled={uploading}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{uploading ? 'Uploading...' : 'Add Resource from URL'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickAndUpload} disabled={uploading}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{uploading ? 'Uploading...' : 'Pick & Upload Document'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, borderWidth: 1 },
  uploadBtn: { backgroundColor: '#3b5bfd', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  restrictedIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  restrictedTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  restrictedText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  backBtn: {
    backgroundColor: '#3b5bfd',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
});
