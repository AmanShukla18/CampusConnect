import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FormTextInput } from '@/components/auth/FormTextInput';
import { LoginIllustration } from '@/components/auth/LoginIllustration';
import { PrimaryButton } from '@/components/auth/PrimaryButton';
import { SwitchRow } from '@/components/auth/SwitchRow';
import { Theme } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Login to CampusConnect</Text>
          <LoginIllustration />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Welcome to CampusConnect</Text>
          <Text style={styles.subtitle}>Sign in to access your campus resources</Text>

          <View style={styles.inputContainer}>
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
          </View>

          <View style={styles.optionsRow}>
            <SwitchRow label="Remember me" value={remember} onValueChange={setRemember} />
            <Link href="/(auth)/reset" style={styles.link}>Forgot Password?</Link>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton title="Login" onPress={() => {}} />
          </View>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/signup" style={styles.link}>Sign Up</Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  formSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  link: {
    color: Theme.colors.link,
    fontSize: 14,
    fontWeight: '600',
  },
  gap16: { height: 16 },
  gap20: { height: 20 },
  footerSection: {
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: Theme.colors.textSecondary,
    fontSize: 16,
  },
});

