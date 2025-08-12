import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormTextInput } from '@/components/auth/FormTextInput';
import { LoginIllustration } from '@/components/auth/LoginIllustration';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { Theme } from '@/constants/theme';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Create Account</Text>
        <LoginIllustration />

        <Text style={styles.sectionTitle}>Join CampusConnect</Text>

        <View style={styles.gap20} />
        <FormTextInput
          value={name}
          onChangeText={setName}
          placeholder="Full Name"
          returnKeyType="next"
        />
        <View style={styles.gap20} />
        <FormTextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email or Student ID"
          returnKeyType="next"
        />
        <View style={styles.gap20} />
        <FormTextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          returnKeyType="done"
        />

        <View style={styles.gap24} />
        <PrimaryButton title="Sign Up" onPress={() => {}} />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>Login</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  link: {
    color: Theme.colors.link,
    fontSize: 14,
    fontWeight: '600',
  },
  gap16: { height: 16 },
  gap20: { height: 20 },
  gap24: { height: 24 },
  footerRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: Theme.colors.textSecondary,
  },
});
