import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Image, Switch, ScrollView, Platform, KeyboardAvoidingView,
  Dimensions, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const HERO_DEFAULT = require('../../assets/splash-icon.png');
let COLLEGE_IMG: any;
try { COLLEGE_IMG = require('../../assets/krmu pic.jpg'); } catch (e) { COLLEGE_IMG = HERO_DEFAULT; }

export default function LoginScreen({ navigation }: any) {
  const { signInWithCredentials } = useAuth() as any;
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  async function onLogin() {
    const e = email.trim().toLowerCase();
    if (!e || !password) {
      alert('Enter email and password');
      return;
    }
    setLoading(true);
    const ok = await signInWithCredentials(e, password);
    setLoading(false);
    if (!ok) alert('Invalid credentials. Please try again or sign up.');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Banner */}
        <Animated.View entering={FadeInUp.duration(900).springify()} style={styles.heroBanner}>
          <Image source={COLLEGE_IMG} style={styles.heroImage} resizeMode="cover" />
          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', isDark ? '#0f172a' : '#f8fafc']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroBadge}>
            <Ionicons name="school" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.heroBadgeText}>CampusConnect</Text>
          </View>
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>

          <Text style={[styles.greeting, { color: colors.text }]}>Welcome back 👋</Text>
          <Text style={[styles.subGreeting, { color: colors.subText }]}>
            Sign in to your CampusConnect account
          </Text>

          {/* Email */}
          <View style={[
            styles.inputWrap,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              borderColor: emailFocused ? colors.primary : 'transparent',
            }
          ]}>
            <Ionicons name="mail-outline" size={20} color={emailFocused ? colors.primary : colors.subText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email or Student ID"
              placeholderTextColor={colors.subText}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password */}
          <View style={[
            styles.inputWrap,
            {
              backgroundColor: isDark ? '#0f172a' : '#f1f5f9',
              borderColor: passFocused ? colors.primary : 'transparent',
            }
          ]}>
            <Ionicons name="lock-closed-outline" size={20} color={passFocused ? colors.primary : colors.subText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.subText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onSubmitEditing={onLogin}
              returnKeyType="go"
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.subText} />
            </TouchableOpacity>
          </View>

          {/* Remember / Forgot */}
          <View style={styles.row}>
            <View style={styles.rememberRow}>
              <Switch
                value={remember}
                onValueChange={setRemember}
                trackColor={{ false: '#d1d5db', true: colors.primary }}
                thumbColor="#fff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
              <Text style={[styles.rememberText, { color: colors.subText }]}>Remember me</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity onPress={onLogin} disabled={loading} activeOpacity={0.85} style={styles.loginBtnWrapper}>
            <LinearGradient
              colors={['#4f46e5', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.loginBtn, loading && { opacity: 0.75 }]}
            >
              <Text style={styles.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
            <Text style={[styles.dividerText, { color: colors.subText }]}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
          </View>

          {/* Sign up */}
          <TouchableOpacity
            style={[styles.signupBtn, { borderColor: isDark ? '#334155' : '#e2e8f0' }]}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={[styles.signupBtnText, { color: colors.text }]}>
              New to CampusConnect?{' '}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Create Account</Text>
            </Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  heroBanner: {
    width,
    height: height * 0.36,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBadge: {
    position: 'absolute',
    top: 52,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  heroBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  card: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 15,
    marginBottom: 32,
    lineHeight: 22,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    paddingHorizontal: 16,
    height: 58,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeBtn: {
    padding: 8,
    marginRight: -4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberText: {
    fontSize: 14,
    marginLeft: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loginBtnWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 28,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
  },
  signupBtn: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signupBtnText: {
    fontSize: 15,
  },
});
