import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, ScrollView, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Welcome to\nCampusConnect',
    description: 'Your all-in-one campus super app. Stay in the loop with notices, events, and what\'s happening across campus — in real time.',
    icon: 'rocket-outline' as const,
    gradient: ['#4f46e5', '#7c3aed'] as [string, string],
    accentColor: '#4f46e5',
    features: ['📢 Real-time Notices', '🎉 Campus Events', '📰 Tech News Feed'],
  },
  {
    id: '2',
    title: 'Study. Share.\nGrow Together.',
    description: 'Find the perfect study group, share notes and resources, and collaborate with classmates and faculty across your school.',
    icon: 'people-circle-outline' as const,
    gradient: ['#0ea5e9', '#06b6d4'] as [string, string],
    accentColor: '#0ea5e9',
    features: ['📚 Study Groups', '📁 Resource Library', '💬 Group Chat'],
  },
  {
    id: '3',
    title: 'Lost Something?\nWe\'ve Got You.',
    description: 'Report lost items, recover belongings, and never miss a thing again. Our smart search connects you with the right people.',
    icon: 'search-circle-outline' as const,
    gradient: ['#f59e0b', '#ef4444'] as [string, string],
    accentColor: '#f59e0b',
    features: ['🔍 Lost & Found', '🔔 Smart Alerts', '📍 Campus Search'],
  },
  {
    id: '4',
    title: 'One Hub.\nInfinite Possibilities.',
    description: 'From student to teacher, admin to newcomer — CampusConnect brings your entire academic world into one beautiful, unified experience.',
    icon: 'school-outline' as const,
    gradient: ['#10b981', '#059669'] as [string, string],
    accentColor: '#10b981',
    features: ['👤 Smart Profiles', '🛡️ Role-Based Access', '🌐 Fully Connected'],
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      navigation.replace('GetStarted');
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    navigation.replace('GetStarted');
  };

  const currentSlide = SLIDES[currentIndex];

  const renderSlide = ({ item, index }: any) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    const translateY = scrollX.interpolate({ inputRange, outputRange: [40, 0, 40], extrapolate: 'clamp' });

    return (
      <View style={[styles.slide, { width }]}>
        {/* Big Gradient Hero Area */}
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          {/* Decorative circles */}
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
          <View style={[styles.decorCircle, styles.decorCircle3]} />

          <Animated.View style={[styles.iconContainer, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.iconBg}>
              <Ionicons name={item.icon} size={90} color="#ffffff" />
            </View>
          </Animated.View>

          <Animated.Text style={[styles.heroTitle, { opacity }]}>
            {item.title}
          </Animated.Text>
        </LinearGradient>

        {/* Content Scroll Area */}
        <View style={styles.contentArea}>
          <Animated.Text style={[styles.description, { opacity }]}>
            {item.description}
          </Animated.Text>

          {/* Feature pills */}
          <Animated.View style={[styles.featureRow, { opacity }]}>
            {item.features.map((f: string, i: number) => (
              <View key={i} style={[styles.featurePill, { borderColor: item.accentColor + '40', backgroundColor: item.accentColor + '12' }]}>
                <Text style={[styles.featureText, { color: item.accentColor }]}>{f}</Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(i: any) => i.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e: any) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      />

      {/* Fixed Bottom Controls */}
      <Reanimated.View
        entering={FadeInDown.delay(400).duration(800)}
        style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 20) + 16 }]}
      >
        {/* Dot indicators */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_: any, i: number) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [10, 28, 10],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange: [(i - 1) * width, i * width, (i + 1) * width],
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity: dotOpacity, backgroundColor: SLIDES[i].accentColor }]}
              />
            );
          })}
        </View>

        {/* Button row */}
        <View style={styles.btnRow}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext} style={styles.nextBtnWrapper} activeOpacity={0.85}>
            <LinearGradient
              colors={currentSlide.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextBtn}
            >
              <Text style={styles.nextText}>
                {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <Ionicons
                name={currentIndex === SLIDES.length - 1 ? 'checkmark-circle-outline' : 'arrow-forward'}
                size={22}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Reanimated.View>
    </View>
  );
}

const HERO_HEIGHT = height * 0.52;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  slide: {
    height,
    backgroundColor: '#0f172a',
  },
  heroGradient: {
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    overflow: 'hidden',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: { width: 300, height: 300, top: -100, right: -80 },
  decorCircle2: { width: 200, height: 200, bottom: -60, left: -60 },
  decorCircle3: { width: 140, height: 140, top: 60, left: 30 },
  iconContainer: {
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  iconBg: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    paddingHorizontal: 24,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  description: {
    fontSize: 17,
    color: '#94a3b8',
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featurePill: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  skipText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
  nextBtnWrapper: {
    flex: 1,
    marginLeft: 16,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 18,
  },
  nextText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
