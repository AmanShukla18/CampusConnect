import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, ActivityIndicator, useWindowDimensions, Platform, KeyboardAvoidingView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api/client';
import { useTheme } from '../context/ThemeContext';

let COLLEGE_IMG: any;
try { COLLEGE_IMG = require('../../assets/krmu pic.jpg'); } catch (e) { COLLEGE_IMG = undefined; }

const DESIGNATIONS = ['Student', 'Teacher'];
const SCHOOLS = ['SOET', 'SOMC', 'SMAS', 'SLAS', 'SOAD'];

export default function SignupScreen({ navigation }: any) {
  const { signup } = useAuth() as any;
  const { colors, isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [school, setSchool] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

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

  async function doSignup() {
    if (!email || !password) return Alert.alert('Missing Fields', 'Please provide email and password');
    if (!name || !phone || !designation || !school) return Alert.alert('Missing Fields', 'Please fill in all the required fields');

    setUploading(true);
    try {
      let photoUrl: string | undefined = undefined;
      if (photoUri) {
        photoUrl = await uploadPhoto(photoUri) || undefined;
      }
      const role = designation.toLowerCase();
      const ok = await signup(email, password, {
        name, phone, designation, school, photoUrl, role,
      });

      setUploading(false);

      if (!ok) return Alert.alert('Error', 'Account already exists or server error');

      if (designation === 'Teacher') {
        Alert.alert('Signup successful!', 'Please wait for admin approval.');
      }
    } catch (error) {
      setUploading(false);
      Alert.alert('Error', 'Failed to create account');
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.mainContainer, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[
        styles.scrollContainer,
        isDesktop && styles.scrollContainerDesktop
      ]} showsVerticalScrollIndicator={false}>
        <View style={[
          styles.contentContainer,
          isDesktop && styles.cardDesktop,
          isDesktop && { backgroundColor: colors.card, borderColor: colors.border }
        ]}>
          {COLLEGE_IMG && <Image source={COLLEGE_IMG} style={[styles.hero, isDesktop && styles.heroDesktop]} resizeMode="cover" />}
          
          <Text style={[styles.title, { color: colors.text }]}>Create an Account</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>Join the CampusConnect community today.</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={pickImage} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: isDark ? '#1f2937' : '#eaf0ff' }]}>
                <Ionicons name="camera" size={32} color="#3b5bfd" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
            {photoUri && (
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.formGrid}>
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput placeholder="Full Name *" placeholderTextColor={colors.subText} value={name} onChangeText={setName} style={[styles.input, { color: colors.text }]} />
            </View>
            
            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput placeholder="Email *" placeholderTextColor={colors.subText} value={email} onChangeText={setEmail} style={[styles.input, { color: colors.text }]} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput placeholder="Phone Number *" placeholderTextColor={colors.subText} value={phone} onChangeText={setPhone} style={[styles.input, { color: colors.text }]} keyboardType="phone-pad" />
            </View>

            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: isDesktop ? 16 : 0 }}>
              <View style={[styles.pickerContainer, { flex: 1 }]}>
                <Text style={[styles.pickerLabel, { color: colors.subText }]}>Designation *</Text>
                <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Picker selectedValue={designation} onValueChange={setDesignation} style={[styles.picker, { color: colors.text }]} dropdownIconColor={colors.text}>
                    <Picker.Item label="Select..." value="" color={isDark ? '#999' : '#000'} />
                    {DESIGNATIONS.map((des) => <Picker.Item key={des} label={des} value={des} color={isDark ? '#eee' : '#000'} />)}
                  </Picker>
                </View>
              </View>

              <View style={[styles.pickerContainer, { flex: 1 }]}>
                <Text style={[styles.pickerLabel, { color: colors.subText }]}>School/Dept *</Text>
                <View style={[styles.pickerWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Picker selectedValue={school} onValueChange={setSchool} style={[styles.picker, { color: colors.text }]} dropdownIconColor={colors.text}>
                    <Picker.Item label="Select..." value="" color={isDark ? '#999' : '#000'} />
                    {SCHOOLS.map((sch) => <Picker.Item key={sch} label={sch} value={sch} color={isDark ? '#eee' : '#000'} />)}
                  </Picker>
                </View>
              </View>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.subText} style={styles.inputIcon} />
              <TextInput
                placeholder="Password *"
                placeholderTextColor={colors.subText}
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                style={[styles.input, { color: colors.text }]}
                onSubmitEditing={doSignup}
                returnKeyType="go"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={22} color={colors.subText} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.btn, uploading && { opacity: 0.7 }]} onPress={doSignup} disabled={uploading} activeOpacity={0.8}>
            {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ marginTop: 24, paddingVertical: 8 }}>
            <Text style={[styles.linkText, { color: colors.subText }]}>
              Already have an account? <Text style={{ color: '#3b5bfd', fontWeight: '700' }}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  scrollContainerDesktop: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  cardDesktop: {
    borderRadius: 24,
    padding: 40,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  hero: { width: '100%', height: 140, borderRadius: 20, marginBottom: 20 },
  heroDesktop: { height: 180 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 15, marginBottom: 24 },
  photoContainer: { alignSelf: 'center', marginBottom: 24, position: 'relative' },
  photoPreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#3b5bfd' },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b5bfd',
    borderStyle: 'dashed',
  },
  photoText: { color: '#3b5bfd', fontWeight: '700', fontSize: 12, marginTop: 4 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b5bfd',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  formGrid: { gap: 16, marginBottom: 24 },
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
  pickerContainer: { marginBottom: 16 },
  pickerLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginLeft: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
  pickerWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
  },
  picker: { height: 56 },
  eyeButton: { padding: 8, marginRight: -8 },
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
  linkText: {
    textAlign: 'center',
    fontSize: 15,
  },
});
