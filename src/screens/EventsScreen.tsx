import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';

type Event = {
  _id: string;
  title: string;
  date: string;
  location: string;
  organizer: string;
  description: string;
  imageUrl?: string;
  timings?: string;
  school?: string;
};

export default function EventsScreen() {
  const { userProfile, email } = useAuth();
  const { colors, isDark } = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [organizer, setOrganizer] = useState(''); // Can default to user name
  const [description, setDescription] = useState('');
  const [timings, setTimings] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isTeacher = userProfile?.designation === 'Teacher';
  const isAdmin = userProfile?.role === 'admin';

  const { socket } = useSocket();

  useEffect(() => {
    let mounted = true;
    async function fetchEvents() {
      if (!isAdmin && !userProfile?.school) return;
      if (!mounted) return;
      setLoading(true);
      try {
        const schoolQuery = (!isAdmin && userProfile?.school) ? `?school=${encodeURIComponent(userProfile.school)}` : '';
        const response = await fetch(`${API_BASE_URL}/api/events${schoolQuery}`);
        if (response.ok) {
          const data = await response.json();
          if (mounted) setEvents(data);
        }
      } catch (e) {
        if (mounted) {
          console.error('Failed to fetch events', e);
          Alert.alert('Network Error', 'Failed to fetch events. Showing offline data if available.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchEvents();
    return () => { mounted = false; };
  }, [userProfile, isAdmin]);

  useEffect(() => {
    if (!socket) return;
    socket.on('event:create', (newEvent: Event) => {
      if (isAdmin || !userProfile?.school || newEvent.school === userProfile.school) {
        setEvents((prev) => [...prev, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      }
    });
    return () => {
      socket.off('event:create');
    };
  }, [socket, userProfile, isAdmin]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  async function uploadImage(uri: string): Promise<string | null> {
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: 'event.jpg',
      type: 'image/jpeg',
    } as any);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (e) {
      console.error('Upload failed', e);
    }
    return null;
  }

  async function createEvent() {
    if (!title || !location || !timings) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setCreating(true);
    let imageUrl = '';

    if (selectedImage) {
      const url = await uploadImage(selectedImage);
      if (url) imageUrl = url;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          date: date.toISOString(),
          location,
          organizer: userProfile?.name || 'Unknown',
          description,
          imageUrl,
          timings,
          school: userProfile?.school,
          createdByEmail: email,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Event created successfully!');
        setModalVisible(false);
        resetForm();
        // Force refresh somehow
      } else {
        Alert.alert('Error', 'Failed to create event');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDate(new Date());
    setLocation('');
    setOrganizer('');
    setDescription('');
    setTimings('');
    setSelectedImage(null);
  }

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    title: { color: colors.text },
    card: { backgroundColor: colors.card, borderColor: colors.border },
    cardTitle: { color: colors.text },
    cardMeta: { color: colors.subText },
    cardDesc: { color: colors.subText },
    organizerTag: { backgroundColor: isDark ? '#1e293b' : '#eaf0ff' },
    empty: { color: colors.subText },
    modalContainer: { backgroundColor: colors.background },
    modalHeader: { backgroundColor: colors.card, borderBottomColor: colors.border },
    modalTitle: { color: colors.text },
    label: { color: colors.text },
    input: { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
    dateBtn: { backgroundColor: colors.inputBg, borderColor: colors.border },
    dateText: { color: colors.text },
    imageBtn: { backgroundColor: colors.inputBg, borderColor: colors.border },
    imageText: { color: colors.subText },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>Events</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b5bfd" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={[styles.card, dynamicStyles.card]}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : null}
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, dynamicStyles.cardTitle]}>{item.title}</Text>
                <View style={styles.row}>
                  <Ionicons name="calendar" size={18} color="#3b5bfd" />
                  <Text style={[styles.cardMeta, dynamicStyles.cardMeta]}>{new Date(item.date).toDateString()}</Text>
                </View>
                <View style={styles.row}>
                  <Ionicons name="time" size={18} color="#3b5bfd" />
                  <Text style={[styles.cardMeta, dynamicStyles.cardMeta]}>{item.timings}</Text>
                </View>
                <View style={styles.row}>
                  <Ionicons name="location" size={18} color="#3b5bfd" />
                  <Text style={[styles.cardMeta, dynamicStyles.cardMeta]}>{item.location}</Text>
                </View>
                {item.description ? (
                  <Text style={[styles.cardDesc, dynamicStyles.cardDesc]}>{item.description}</Text>
                ) : null}
                <View style={[styles.organizerTag, dynamicStyles.organizerTag]}>
                  <Text style={styles.organizerText}>Organized by {item.organizer}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.empty, dynamicStyles.empty]}>No upcoming events for {userProfile?.school || 'your school'}.</Text>}
        />
      )}

      {isTeacher && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, dynamicStyles.modalContainer]}>
          <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
            <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Create Event</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <Text style={[styles.label, dynamicStyles.label]}>Event Name</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} placeholderTextColor={colors.subText} value={title} onChangeText={setTitle} placeholder="e.g. Manthan AI 2025" />

            <Text style={[styles.label, dynamicStyles.label]}>Date</Text>
            <TouchableOpacity style={[styles.dateBtn, dynamicStyles.dateBtn]} onPress={() => setShowDatePicker(true)}>
              <Text style={dynamicStyles.dateText}>{date.toDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <Text style={[styles.label, dynamicStyles.label]}>Timings</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} placeholderTextColor={colors.subText} value={timings} onChangeText={setTimings} placeholder="e.g. 10:00 AM onwards" />

            <Text style={[styles.label, dynamicStyles.label]}>Venue</Text>
            <TextInput style={[styles.input, dynamicStyles.input]} placeholderTextColor={colors.subText} value={location} onChangeText={setLocation} placeholder="e.g. A BLOCK, Room 213" />

            <Text style={[styles.label, dynamicStyles.label]}>Notes / Description</Text>
            <TextInput
              style={[styles.input, dynamicStyles.input, { height: 80 }]}
              placeholderTextColor={colors.subText}
              value={description}
              onChangeText={setDescription}
              placeholder="Event details..."
              multiline
            />

            <Text style={[styles.label, dynamicStyles.label]}>Event Image</Text>
            <TouchableOpacity style={[styles.imageBtn, dynamicStyles.imageBtn]} onPress={pickImage}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={{ width: '100%', height: 200, borderRadius: 8 }} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="image-outline" size={32} color={colors.subText} />
                  <Text style={[styles.imageText, dynamicStyles.imageText]}>Tap to select image</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={createEvent} disabled={creating}>
              {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Event</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f8ff' },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 16, color: '#1f2937' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e6e9f3',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardImage: { width: '100%', height: 200 },
  cardContent: { padding: 20 },
  cardTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#1f2937' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardMeta: { marginLeft: 8, color: '#4b5563', fontSize: 15, fontWeight: '500' },
  cardDesc: { marginTop: 12, color: '#6b7280', fontSize: 15, lineHeight: 22 },
  organizerTag: {
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#eaf0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  organizerText: { color: '#3b5bfd', fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    backgroundColor: '#3b5bfd',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  closeText: { color: '#3b5bfd', fontSize: 16, fontWeight: '600' },
  form: { padding: 20 },
  label: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    fontSize: 16,
  },
  dateBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
  },
  imageBtn: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imageText: { color: '#6b7280' },
  submitBtn: {
    backgroundColor: '#3b5bfd',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
