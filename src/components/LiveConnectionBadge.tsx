import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { nativeDriver } from '../utils/animations';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';

export default function LiveConnectionBadge() {
  const { isConnected } = useSocket();
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isConnected) {
      // Pulse animation when connected securely
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.4, duration: 1000, useNativeDriver: nativeDriver }),
          Animated.timing(opacity, { toValue: 1, duration: 1000, useNativeDriver: nativeDriver })
        ])
      ).start();
    } else {
      opacity.setValue(1);
    }
  }, [isConnected]);

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.dot, 
        { opacity, backgroundColor: isConnected ? '#10b981' : '#ef4444' }
      ]} />
      {!isConnected && (
         <Ionicons name="sync-outline" size={12} color="#ef4444" style={styles.spinner} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  spinner: {
    marginLeft: 2,
  }
});
