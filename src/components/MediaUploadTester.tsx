import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Platform } from 'react-native';
import { pickMedia, MediaSource } from '../lib/mediaPicker';
import { uploadMedia } from '../lib/upload';
import { InlineVideo } from './InlineVideo';

export function MediaUploadTester() {
  const [status, setStatus] = useState('Idle');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function triggerUpload(source: MediaSource) {
    setIsUploading(true);
    setStatus(`Picking from ${source}...`);
    try {
      const picked = await pickMedia(source);
      if (!picked) {
        setStatus('Selection cancelled');
        return;
      }
      setStatus('Uploading to Cloudinary...');
      const result = await uploadMedia({
        uri: picked.uri,
        mimeType: picked.mimeType,
        fileName: picked.fileName,
        mediaType: picked.type,
      });
      setMediaUrl(result.url);
      setMediaType(picked.type);
      setStatus('Upload complete');
    } catch (error: any) {
      console.error('MediaUploadTester error', error);
      setStatus(error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Media Upload Tester</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} disabled={isUploading} onPress={() => triggerUpload('library')}>
          <Text style={styles.buttonText}>{isUploading ? 'Working...' : 'Pick from Gallery'}</Text>
        </TouchableOpacity>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.button} disabled={isUploading} onPress={() => triggerUpload('camera')}>
            <Text style={styles.buttonText}>{isUploading ? 'Working...' : 'Use Camera'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.statusRow}>
        {isUploading && <ActivityIndicator size="small" color="#3b5bfd" />}
        <Text style={styles.statusText}>{status}</Text>
      </View>
      {mediaUrl ? (
        mediaType === 'video' ? (
          <InlineVideo uri={mediaUrl} style={styles.preview} />
        ) : (
          <Image source={{ uri: mediaUrl }} style={styles.preview} />
        )
      ) : (
        <Text style={styles.instructions}>Use the buttons above to test uploading images or videos.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, borderRadius: 16, backgroundColor: '#eef3ff', gap: 12 },
  heading: { fontSize: 18, fontWeight: '700', color: '#1b2653' },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, backgroundColor: '#3b5bfd', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { color: '#1b2653', fontSize: 14, flex: 1 },
  preview: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#d8e1ff' },
  instructions: { color: '#52607a' },
});
