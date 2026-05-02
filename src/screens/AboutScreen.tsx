import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Dimensions, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'notifications-outline', title: 'Real-Time Notices', desc: 'Instant campus-wide announcements and critical updates at your fingertips.' },
  { icon: 'people-outline', title: 'Study Groups', desc: 'Find like-minded peers, collaborate on projects, and share knowledge freely.' },
  { icon: 'search-outline', title: 'Lost & Found', desc: 'Quickly report or recover lost items using our smart campus search system.' },
  { icon: 'folder-open-outline', title: 'Resources Hub', desc: 'Upload, discover, and download study materials shared by students and faculty.' },
  { icon: 'rocket-outline', title: 'Event Hub', desc: 'Stay updated on tech fests, seminars, cultural events, and college workshops.' },
  { icon: 'newspaper-outline', title: 'Tech News', desc: 'Curated live tech news feed powered by real-time aggregation from top sources.' },
];

const STATS = [
  { value: '10K+', label: 'Students' },
  { value: '50+', label: 'Colleges' },
  { value: '99%', label: 'Uptime' },
  { value: '4.9★', label: 'Rating' },
];

export default function AboutScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();

  const handleContact = (type: 'email' | 'web' | 'github') => {
    if (type === 'email') Linking.openURL('mailto:support@campusconnect.com');
    if (type === 'web') Linking.openURL('https://campusconnect.com');
    if (type === 'github') Linking.openURL('https://github.com/Pranav3460/UniSpace');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]} edges={['bottom']}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* === HERO HEADER === */}
        <Animated.View entering={FadeInUp.duration(900).springify()}>
          <LinearGradient
            colors={['#4f46e5', '#7c3aed', '#0ea5e9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            {/* decorative circles */}
            <View style={[styles.decor, { width: 280, height: 280, top: -100, right: -80, backgroundColor: 'rgba(255,255,255,0.07)' }]} />
            <View style={[styles.decor, { width: 180, height: 180, bottom: -60, left: -50, backgroundColor: 'rgba(255,255,255,0.05)' }]} />

            <View style={styles.heroBadge}>
              <Ionicons name="school" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.heroBadgeText}>Campus Super App</Text>
            </View>

            <Ionicons name="school" size={72} color="rgba(255,255,255,0.95)" style={{ marginBottom: 16 }} />
            <Text style={styles.heroTitle}>CampusConnect</Text>
            <Text style={styles.heroSubtitle}>Connecting every student, every day.</Text>
          </LinearGradient>
        </Animated.View>

        {/* === STATS ROW === */}
        <Animated.View entering={FadeInDown.delay(200).duration(700).springify()} style={[styles.statsRow, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
          {STATS.map((s, i) => (
            <View key={i} style={[styles.statItem, i < STATS.length - 1 && { borderRightWidth: 1, borderRightColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>{s.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* === MISSION === */}
        <Animated.View entering={FadeInDown.delay(300).duration(700).springify()} style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.cardIcon}>
              <Ionicons name="flag-outline" size={20} color="#fff" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Our Mission</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.subText }]}>
            CampusConnect is designed by students, for students. We believe campus life should be connected, dynamic, and frictionless — from finding lost items to organizing massive tech seminars. Our platform bridges the gap between chaos and community, one tap at a time.
          </Text>
        </Animated.View>

        {/* === FEATURES GRID === */}
        <Animated.View entering={FadeInDown.delay(400).duration(700).springify()} style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Everything You Need</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.subText }]}>Six powerful modules built for campus life</Text>
        </Animated.View>

        <View style={styles.featuresGrid}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(400 + i * 80).duration(600).springify()}
              style={[styles.featureCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
            >
              <LinearGradient
                colors={['#4f46e5', '#7c3aed']}
                style={styles.featureIcon}
              >
                <Ionicons name={f.icon as any} size={22} color="#fff" />
              </LinearGradient>
              <Text style={[styles.featureTitle, { color: colors.text }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: colors.subText }]}>{f.desc}</Text>
            </Animated.View>
          ))}
        </View>

        {/* === ABOUT TEAM === */}
        <Animated.View entering={FadeInDown.delay(700).duration(700).springify()} style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.cardIcon}>
              <Ionicons name="people-outline" size={20} color="#fff" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: colors.text }]}>About the Team</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.subText }]}>
            We're a passionate group of developers and designers on a mission to transform education technology. Built with ❤️ using React Native, Node.js, MongoDB, and Socket.io — CampusConnect delivers a modern, human-centric campus experience unlike anything else.
          </Text>
        </Animated.View>

        {/* === CONTACT === */}
        <Animated.View entering={FadeInDown.delay(800).duration(700).springify()} style={[styles.card, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
          <View style={styles.cardHeader}>
            <LinearGradient colors={['#f59e0b', '#ef4444']} style={styles.cardIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Get in Touch</Text>
          </View>
          <Text style={[styles.cardBody, { color: colors.subText, marginBottom: 20 }]}>
            Have a bug to report, a feature request, or just want to say hello? We genuinely love hearing from our community.
          </Text>

          <View style={styles.contactGrid}>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]} onPress={() => handleContact('email')}>
              <Ionicons name="mail" size={22} color="#4f46e5" />
              <Text style={[styles.contactBtnText, { color: colors.text }]}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]} onPress={() => handleContact('github')}>
              <Ionicons name="logo-github" size={22} color="#4f46e5" />
              <Text style={[styles.contactBtnText, { color: colors.text }]}>GitHub</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]} onPress={() => handleContact('web')}>
              <Ionicons name="globe" size={22} color="#4f46e5" />
              <Text style={[styles.contactBtnText, { color: colors.text }]}>Website</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* === FOOTER === */}
        <Animated.View entering={FadeInDown.delay(900).duration(700)} style={styles.footer}>
          <LinearGradient
            colors={isDark ? ['#1e293b', '#0f172a'] : ['#f1f5f9', '#f8fafc']}
            style={styles.footerGradient}
          >
            <Ionicons name="school" size={36} color={colors.primary} />
            <Text style={[styles.footerTitle, { color: colors.text }]}>CampusConnect</Text>
            <Text style={[styles.footerTagline, { color: colors.subText }]}>Made with ❤️ for every student</Text>
            <View style={[styles.footerDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />
            <Text style={[styles.footerVersion, { color: colors.subText }]}>Version 1.0.0 · MIT License · © 2025</Text>
          </LinearGradient>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Hero
  hero: {
    width,
    minHeight: 320,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
    paddingTop: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  decor: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroBadge: {
    position: 'absolute',
    top: 24,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  heroBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  heroTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Cards
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 26,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  // Features grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  featureCard: {
    width: (width - 48) / 2,
    margin: 6,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Contact
  contactGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Footer
  footer: {
    marginTop: 8,
  },
  footerGradient: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  footerTagline: {
    fontSize: 14,
    marginBottom: 24,
  },
  footerDivider: {
    width: 60,
    height: 1,
    marginBottom: 16,
  },
  footerVersion: {
    fontSize: 12,
  },
});
