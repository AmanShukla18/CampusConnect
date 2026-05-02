import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, StatusBar, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const FEATURE_BULLETS = [
  { icon: 'notifications-outline', text: 'Instant notices & campus alerts' },
  { icon: 'people-outline', text: 'Study groups & group chat' },
  { icon: 'rocket-outline', text: 'Events, resources & lost & found' },
];

export default function GetStartedScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full gradient background */}
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative orbs */}
      <View style={[styles.orb, styles.orb1]} />
      <View style={[styles.orb, styles.orb2]} />
      <View style={[styles.orb, styles.orb3]} />

      {/* Top section */}
      <View style={[styles.topSection, { paddingTop: Math.max(insets.top, 40) + 20 }]}>
        <Reanimated.View entering={FadeInUp.duration(900).springify()}>
          {/* Pulsing logo ring */}
          <Animated.View style={[styles.logoRingOuter, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={['#4f46e5', '#7c3aed', '#0ea5e9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Ionicons name="school" size={72} color="#ffffff" />
            </LinearGradient>
          </Animated.View>
        </Reanimated.View>

        <Reanimated.View entering={FadeInUp.delay(200).duration(900).springify()} style={styles.titleGroup}>
          <Text style={styles.appName}>CampusConnect</Text>
          <Text style={styles.tagline}>Your campus. Your community. Redefined.</Text>
        </Reanimated.View>
      </View>

      {/* Bullets */}
      <Reanimated.View entering={FadeInDown.delay(400).duration(800).springify()} style={styles.bulletsCard}>
        {FEATURE_BULLETS.map((b, i) => (
          <View key={i} style={[styles.bullet, i < FEATURE_BULLETS.length - 1 && styles.bulletBorder]}>
            <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.bulletIcon}>
              <Ionicons name={b.icon as any} size={18} color="#fff" />
            </LinearGradient>
            <Text style={styles.bulletText}>{b.text}</Text>
          </View>
        ))}
      </Reanimated.View>

      {/* Bottom CTAs */}
      <Reanimated.View
        entering={FadeInDown.delay(600).duration(800).springify()}
        style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={() => navigation.replace('Signup')} style={styles.primaryBtnWrap}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Join the Community</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryBtnText}>
            Already have an account?{' '}
            <Text style={styles.secondaryBtnHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
    backgroundColor: 'rgba(79,70,229,0.18)',
  },
  orb2: {
    width: 220,
    height: 220,
    bottom: height * 0.25,
    left: -60,
    backgroundColor: 'rgba(14,165,233,0.12)',
  },
  orb3: {
    width: 160,
    height: 160,
    bottom: -40,
    right: 40,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRingOuter: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
    marginBottom: 36,
  },
  logoGradient: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  titleGroup: {
    alignItems: 'center',
    marginBottom: 8,
  },
  appName: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
  },
  bulletsCard: {
    marginHorizontal: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginBottom: 28,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  bulletBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  bulletIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  bottomSection: {
    paddingHorizontal: 24,
  },
  primaryBtnWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 16,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    borderRadius: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
  },
  secondaryBtnHighlight: {
    color: '#818cf8',
    fontWeight: '700',
  },
});
