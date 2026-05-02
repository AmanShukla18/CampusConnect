import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated as RNAnimated, PanResponder, Dimensions, ViewStyle } from 'react-native';
import { nativeDriver } from '../../utils/animations';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from 'expo-blur'; // Assuming expo-blur is available or standard View fallback

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SnapPoint = '40%' | '70%' | '100%';

interface BottomSheetProps {
    visible: boolean;
    onClose: () => void;
    snapPoint?: SnapPoint;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    visible,
    onClose,
    snapPoint = '40%',
    children,
    style,
}) => {
    const { theme, isDark } = useTheme();
    const [modalVisible, setModalVisible] = useState(visible);
    
    const getTargetHeight = () => {
        switch (snapPoint) {
            case '100%': return SCREEN_HEIGHT * 0.95; // Leaves a tiny gap at top
            case '70%': return SCREEN_HEIGHT * 0.7;
            case '40%': default: return SCREEN_HEIGHT * 0.4;
        }
    };

    const targetHeight = getTargetHeight();
    const translateY = useRef(new RNAnimated.Value(SCREEN_HEIGHT)).current;
    const fadeOpacity = useRef(new RNAnimated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setModalVisible(true);
            RNAnimated.parallel([
                RNAnimated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: nativeDriver,
                    bounciness: 4,
                }),
                RNAnimated.timing(fadeOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: nativeDriver,
                })
            ]).start();
        } else {
            closeAnimation();
        }
    }, [visible, snapPoint]);

    const closeAnimation = () => {
        RNAnimated.parallel([
            RNAnimated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: nativeDriver,
            }),
            RNAnimated.timing(fadeOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: nativeDriver,
            })
        ]).start(() => setModalVisible(false));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Only respond to vertical gestures
                return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > targetHeight * 0.25 || gestureState.vy > 1.5) {
                    // Swipe down threshold met, close it
                    onClose();
                } else {
                    // Snap back
                    RNAnimated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: nativeDriver,
                        bounciness: 4,
                    }).start();
                }
            },
        })
    ).current;

    if (!modalVisible) return null;

    return (
        <Modal
            transparent
            visible={modalVisible}
            onRequestClose={onClose}
            animationType="none" // Handled manually
        >
            <View style={styles.overlay}>
                <RNAnimated.View style={[styles.backdrop, { opacity: fadeOpacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                        {/* Optionally use expo-blur if available, but for now simple dark overlay */}
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]} />
                    </Pressable>
                </RNAnimated.View>

                <RNAnimated.View 
                    style={[
                        styles.sheetContainer,
                        {
                            height: targetHeight,
                            backgroundColor: theme.colors.card,
                            transform: [{ translateY }],
                            borderTopLeftRadius: theme.borderRadius.xl,
                            borderTopRightRadius: theme.borderRadius.xl,
                        },
                        style
                    ]}
                >
                    <View {...panResponder.panHandlers} style={styles.handleContainer}>
                        <View style={[styles.handleBar, { backgroundColor: theme.colors.cardBorder }]} />
                    </View>
                    
                    <View style={styles.contentContainer}>
                        {children}
                    </View>
                </RNAnimated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    sheetContainer: {
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
    },
    handleContainer: {
        width: '100%',
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    handleBar: {
        width: 40,
        height: 5,
        borderRadius: 3,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 24,
    }
});
