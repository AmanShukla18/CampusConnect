import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useTheme } from '../context/ThemeContext';

const DESIGNATIONS = [
  'Student',
  'Teacher',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'Professor',
  'Assistant Professor',
  'HOD',
  'Principal',
  'Global Admin / Administrator',
];

const SCHOOLS = ['SOET', 'SOMC', 'SMAS', 'SLAS', 'SOAD', 'CampusConnect'];

export default function ProfileEditScreen({ navigation }: any) {
  const { userProfile, email, refreshProfile } = useAuth();
  const { colors, isDark } = useTheme();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('');
  const [school, setSchool] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Picker modal states
  const [showDesignationPicker, setShowDesignationPicker] = useState(false);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
      setDepartment(userProfile.department || '');
      setSchool(userProfile.school || '');
      setPhotoUri(userProfile.photoUrl || null);

      // For admins: default designation to 'Global Admin / Administrator' if not already set
      const defaultDesignation =
        userProfile.role === 'admin'
          ? 'Global Admin / Administrator'
          : userProfile.designation || '';
      setDesignation(userProfile.designation || defaultDesignation);
    }
  }, [userProfile]);

  async function pickImage() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function uploadPhoto(uri: string): Promise<string | null> {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append('file', blob as any, 'profile.jpg');

      const uploadResponse = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        return data.url;
      }
      return null;
    } catch (error) {
      console.error('Photo upload failed', error);
      return null;
    }
  }

  async function saveProfile() {
    if (!name || !phone || !designation || !school) {
      return Alert.alert('Missing Fields', 'Please fill in all required fields');
    }

    setSaving(true);
    try {
      let photoUrl = userProfile?.photoUrl;

      // Upload new photo if changed
      if (photoUri && photoUri !== userProfile?.photoUrl) {
        const uploadedUrl = await uploadPhoto(photoUri);
        if (uploadedUrl) photoUrl = uploadedUrl;
      }

      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          phone,
          designation,
          department,
          school,
          photoUrl,
        }),
      });

      if (response.ok) {
        await refreshProfile();
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  // Custom picker selector component
  const PickerField = ({
    label,
    value,
    placeholder,
    onPress,
  }: {
    label: string;
    value: string;
    placeholder: string;
    onPress: () => void;
  }) => (
    <View style={styles.pickerContainer}>
      <Text style={[styles.pickerLabel, { color: colors.subText }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.pickerField, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerFieldText, { color: value ? colors.text : colors.subText }]}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.subText} />
      </TouchableOpacity>
    </View>
  );

  // Generic options modal
  const OptionsModal = ({
    visible,
    title,
    options,
    selected,
    onSelect,
    onClose,
  }: {
    visible: boolean;
    title: string;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
    onClose: () => void;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
        <View style={styles.pickerModalHeader}>
          <Text style={[styles.pickerModalTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.subText} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.pickerOption,
                { borderBottomColor: colors.border },
                selected === option && { backgroundColor: '#3b5bfd' + '18' },
              ]}
              onPress={() => {
                onSelect(option);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  { color: selected === option ? '#3b5bfd' : colors.text },
                  selected === option && { fontWeight: '700' },
                ]}
              >
                {option}
              </Text>
              {selected === option && (
                <Ionicons name="checkmark" size={18} color="#3b5bfd" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
          
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>Update your personal information below.</Text>

          <TouchableOpacity style={styles.photoContainer} onPress={pickImage} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? '#1f2937' : '#eaf0ff' }]}>
                <Ionicons name="person" size={40} color="#3b5bfd" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.formSection}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                placeholder="Full Name *"
                placeholderTextColor={colors.subText}
                value={name}
                onChangeText={setName}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                placeholder="Phone Number *"
                placeholderTextColor={colors.subText}
                value={phone}
                onChangeText={setPhone}
                style={[styles.input, { color: colors.text }]}
                keyboardType="phone-pad"
              />
            </View>

            {/* Designation - Custom themed picker */}
            <PickerField
              label="DESIGNATION *"
              value={designation}
              placeholder="Select Designation"
              onPress={() => setShowDesignationPicker(true)}
            />

            {/* Department - Plain text input */}
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: colors.subText }]}>DEPARTMENT</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="school-outline" size={20} color={colors.subText} style={styles.inputIcon} />
                <TextInput
                  placeholder="e.g. Computer Science"
                  placeholderTextColor={colors.subText}
                  value={department}
                  onChangeText={setDepartment}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            {/* School - Custom themed picker */}
            <PickerField
              label="SCHOOL / COLLEGE *"
              value={school}
              placeholder="Select School"
              onPress={() => setShowSchoolPicker(true)}
            />
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.btn, saving && { opacity: 0.7 }]}
              onPress={saveProfile}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: 'transparent' }]}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Designation Picker Modal */}
      <OptionsModal
        visible={showDesignationPicker}
        title="Select Designation"
        options={DESIGNATIONS}
        selected={designation}
        onSelect={setDesignation}
        onClose={() => setShowDesignationPicker(false)}
      />

      {/* School Picker Modal */}
      <OptionsModal
        visible={showSchoolPicker}
        title="Select School"
        options={SCHOOLS}
        selected={school}
        onSelect={setSchool}
        onClose={() => setShowSchoolPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContainer: { flex: 1 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 8, marginTop: 10 },
  subtitle: { fontSize: 16, marginBottom: 32 },
  photoContainer: { 
    alignSelf: 'center', 
    marginBottom: 32, 
    position: 'relative' 
  },
  photoPreview: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    borderWidth: 4, 
    borderColor: '#3b5bfd' 
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#3b5bfd',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b5bfd',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  formSection: { gap: 16, marginBottom: 32 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  pickerContainer: { gap: 6 },
  pickerLabel: { 
    fontSize: 13, 
    fontWeight: '700', 
    marginLeft: 4, 
    letterSpacing: 0.5, 
    textTransform: 'uppercase' 
  },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  pickerFieldText: { fontSize: 16, flex: 1 },
  actionContainer: { gap: 12 },
  btn: {
    backgroundColor: '#3b5bfd',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b5bfd',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: { fontWeight: '700', fontSize: 16 },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
    marginBottom: 4,
  },
  pickerModalTitle: { fontSize: 18, fontWeight: '800' },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
  },
  pickerOptionText: { fontSize: 16 },
});
