import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  eventTitle: string;
};

export default function RejectReasonModal({ visible, onClose, onSubmit, eventTitle }: Props) {
  const { colors, isDark } = useTheme();
  const [reason, setReason] = useState('');

  function handleSubmit() {
    if (reason.trim()) {
      onSubmit(reason.trim());
      setReason('');
      onClose();
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Ionicons name="close-circle" size={32} color="#ef4444" />
            <Text style={[styles.title, { color: colors.text }]}>Reject Event</Text>
          </View>
          <Text style={[styles.eventName, { color: colors.subText }]}>"{eventTitle}"</Text>

          <Text style={[styles.label, { color: colors.text }]}>Reason for Rejection *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholderTextColor={colors.subText}
            placeholder="You must provide a reason for rejection..."
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            autoFocus
          />
          <Text style={[styles.hint, { color: reason.trim() ? colors.success : '#ef4444' }]}>
            {reason.trim() ? '✓ Reason provided' : '✕ Reason is mandatory'}
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn, { opacity: reason.trim() ? 1 : 0.5 }]}
              onPress={handleSubmit}
              disabled={!reason.trim()}
            >
              <Text style={styles.rejectBtnText}>Reject Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700' },
  eventName: { fontSize: 14, marginBottom: 16, fontStyle: 'italic' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: { fontSize: 12, marginTop: 6, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  cancelBtnText: { color: '#6b7280', fontWeight: '700' },
  rejectBtn: { backgroundColor: '#ef4444' },
  rejectBtnText: { color: '#fff', fontWeight: '700' },
});
