import React, { useState } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

const EVENT_TYPES = ['Hackathon', 'Workshop', 'Seminar', 'Competition', 'Other'] as const;
const EVENT_MODES = ['Online', 'Offline', 'Hybrid'] as const;
const SCHOOLS = ['SOET', 'SOMC', 'SMAS', 'SLAS', 'SOAD'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isEdit?: boolean;
};

export default function CreateEventModal({ visible, onClose, onSubmit, initialData, isEdit }: Props) {
  const { colors, isDark } = useTheme();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState(initialData?.title || '');
  const [type, setType] = useState<string>(initialData?.type || 'Other');
  const [description, setDescription] = useState(initialData?.description || '');
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [time, setTime] = useState(initialData?.time || '');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedSchools, setSelectedSchools] = useState<string[]>(initialData?.schools || []);
  const [mode, setMode] = useState<string>(initialData?.mode || 'Offline');
  const [regDeadline, setRegDeadline] = useState(initialData?.registrationDeadline ? new Date(initialData.registrationDeadline) : new Date());
  const [showRegDeadlinePicker, setShowRegDeadlinePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(initialData?.maxParticipants?.toString() || '');
  const [contactName, setContactName] = useState(initialData?.contactName || '');
  const [contactEmail, setContactEmail] = useState(initialData?.contactEmail || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  function toggleSchool(s: string) {
    setSelectedSchools(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleSubmit() {
    if (!title.trim()) return Alert.alert('Required', 'Please enter an event name.');
    if (!description.trim()) return Alert.alert('Required', 'Please enter a description.');
    if (!time.trim()) return Alert.alert('Required', 'Please enter a time.');
    if (!contactName.trim()) return Alert.alert('Required', 'Please enter a contact name.');
    if (!contactEmail.trim()) return Alert.alert('Required', 'Please enter a contact email.');

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type,
        description: description.trim(),
        date: date.toISOString(),
        time: time.trim(),
        schools: selectedSchools,
        mode,
        registrationDeadline: regDeadline.toISOString(),
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit event.');
    } finally {
      setSubmitting(false);
    }
  }

  const bg = colors.background;
  const cardBg = colors.card;
  const textColor = colors.text;
  const subText = colors.subText;
  const inputBg = colors.inputBg;
  const borderColor = colors.border;
  const primary = colors.primary;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: borderColor }]}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {isEdit ? '✏️ Edit Event' : '🚀 Create Event / Hackathon'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-circle" size={28} color={subText} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Event Name */}
          <Text style={[styles.label, { color: textColor }]}>Event Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. HackTheFuture 2025"
          />

          {/* Type */}
          <Text style={[styles.label, { color: textColor }]}>Type *</Text>
          <View style={styles.chipRow}>
            {EVENT_TYPES.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, type === t && { backgroundColor: primary, borderColor: primary }]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.chipText, type === t && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={[styles.label, { color: textColor }]}>Purpose / Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={description}
            onChangeText={setDescription}
            placeholder="Detailed description of the event..."
            multiline
            numberOfLines={4}
          />

          {/* Date */}
          <Text style={[styles.label, { color: textColor }]}>Date *</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: inputBg, borderColor, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={primary} style={{ marginRight: 8 }} />
            <Text style={{ color: textColor }}>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(e, d) => { setShowDatePicker(false); if (d) setDate(d); }}
            />
          )}

          {/* Time */}
          <Text style={[styles.label, { color: textColor }]}>Time *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={time}
            onChangeText={setTime}
            placeholder="e.g. 10:00 AM - 5:00 PM"
          />

          {/* Schools */}
          <Text style={[styles.label, { color: textColor }]}>Participating Schools / Organizations</Text>
          <View style={styles.chipRow}>
            {SCHOOLS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, selectedSchools.includes(s) && { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }]}
                onPress={() => toggleSchool(s)}
              >
                <Text style={[styles.chipText, selectedSchools.includes(s) && { color: '#fff' }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Mode */}
          <Text style={[styles.label, { color: textColor }]}>Mode *</Text>
          <View style={styles.chipRow}>
            {EVENT_MODES.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.chip, mode === m && { backgroundColor: '#10b981', borderColor: '#10b981' }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.chipText, mode === m && { color: '#fff' }]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Registration Deadline */}
          <Text style={[styles.label, { color: textColor }]}>Registration Deadline</Text>
          <TouchableOpacity
            style={[styles.input, { backgroundColor: inputBg, borderColor, flexDirection: 'row', alignItems: 'center' }]}
            onPress={() => setShowRegDeadlinePicker(true)}
          >
            <Ionicons name="time-outline" size={18} color={primary} style={{ marginRight: 8 }} />
            <Text style={{ color: textColor }}>{regDeadline.toDateString()}</Text>
          </TouchableOpacity>
          {showRegDeadlinePicker && (
            <DateTimePicker
              value={regDeadline}
              mode="date"
              display="default"
              onChange={(e, d) => { setShowRegDeadlinePicker(false); if (d) setRegDeadline(d); }}
            />
          )}

          {/* Max Participants */}
          <Text style={[styles.label, { color: textColor }]}>Max Participants</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={maxParticipants}
            onChangeText={setMaxParticipants}
            placeholder="e.g. 100"
            keyboardType="numeric"
          />

          {/* Contact */}
          <Text style={[styles.label, { color: textColor }]}>Contact Person Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={contactName}
            onChangeText={setContactName}
            placeholder="e.g. John Doe"
          />
          <Text style={[styles.label, { color: textColor }]}>Contact Email *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={contactEmail}
            onChangeText={setContactEmail}
            placeholder="e.g. john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Notes */}
          <Text style={[styles.label, { color: textColor }]}>Additional Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor }]}
            placeholderTextColor={subText}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any other relevant details..."
            multiline
            numberOfLines={3}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, { opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>{isEdit ? 'Update Event' : 'Submit Event'}</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  form: { padding: 16 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 16, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  submitBtn: {
    backgroundColor: '#3b5bfd',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
