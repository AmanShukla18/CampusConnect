import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { newDate: string; newTime: string; reason: string }) => void;
  eventTitle: string;
};

export default function PostponeModal({ visible, onClose, onSubmit, eventTitle }: Props) {
  const { colors } = useTheme();
  const [newDate, setNewDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');

  function handleSubmit() {
    onSubmit({
      newDate: newDate.toISOString(),
      newTime: newTime.trim(),
      reason: reason.trim(),
    });
    setReason('');
    setNewTime('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Ionicons name="time" size={30} color="#f59e0b" />
            <Text style={[styles.title, { color: colors.text }]}>Postpone Event</Text>
          </View>
          <Text style={[styles.eventName, { color: colors.subText }]}>"{eventTitle}"</Text>

          <Text style={[styles.label, { color: colors.text }]}>New Date *</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ color: colors.text }}>{newDate.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={newDate}
              mode="date"
              display="default"
              onChange={(e, d) => { setShowDatePicker(false); if (d) setNewDate(d); }}
            />
          )}

          <Text style={[styles.label, { color: colors.text }]}>New Time</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholderTextColor={colors.subText}
            value={newTime}
            onChangeText={setNewTime}
            placeholder="e.g. 2:00 PM - 6:00 PM"
          />

          <Text style={[styles.label, { color: colors.text }]}>Reason for Postponement</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
            placeholderTextColor={colors.subText}
            value={reason}
            onChangeText={setReason}
            placeholder="(Optional) Explain why the event is being postponed..."
            multiline
            numberOfLines={3}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.postponeBtn]} onPress={handleSubmit}>
              <Text style={styles.postponeBtnText}>Postpone</Text>
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
  label: { fontSize: 13, fontWeight: '700', marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  cancelBtnText: { color: '#6b7280', fontWeight: '700' },
  postponeBtn: { backgroundColor: '#f59e0b' },
  postponeBtnText: { color: '#fff', fontWeight: '700' },
});
