import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    Easing,
    interpolate,
    withDelay
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type FABAction = {
    id: string;
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
};

interface FABProps {
    icon: React.ReactNode;
    onPress?: () => void;
    label?: string; // If provided without actions, it's an extended FAB
    actions?: FABAction[]; // If provided, it becomes an expandable FAB
    style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
    icon,
    onPress,
    label,
    actions,
    style,
}) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    
    // Entrance animation
    const scale = useSharedValue(0);
    const pressScale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const expansion = useSharedValue(0);

    useEffect(() => {
        scale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 200 }));
    }, []);

    const handleMainPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (actions && actions.length > 0) {
            setIsOpen(!isOpen);
            rotation.value = withTiming(!isOpen ? 45 : 0, { duration: 200, easing: Easing.inOut(Easing.ease) });
            expansion.value = withSpring(!isOpen ? 1 : 0, { damping: 15, stiffness: 150 });
        } else if (onPress) {
            onPress();
        }
    };

    const handlePressIn = () => {
        pressScale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
        pressScale.value = withSpring(1);
    };

    const mainAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: scale.value * pressScale.value },
                { rotate: `${rotation.value}deg` }
            ]
        };
    });

    const isExtended = !!label && (!actions || actions.length === 0);

    return (
        <View style={[styles.container, style]}>
            {/* Expandable actions list */}
            {actions && actions.length > 0 && (
                <View style={styles.actionsContainer}>
                    {actions.map((action, index) => {
                        const actionAnimatedStyle = useAnimatedStyle(() => {
                            const translateY = interpolate(expansion.value, [0, 1], [20 * (index + 1), 0]);
                            const opacity = expansion.value;
                            return {
                                transform: [{ translateY }, { scale: expansion.value }],
                                opacity: opacity,
                                marginBottom: 16,
                            };
                        });

                        return (
                            <Animated.View key={action.id} style={[styles.actionRow, actionAnimatedStyle]}>
                                <Text style={[styles.actionLabel, { 
                                    color: theme.colors.card, 
                                    backgroundColor: theme.colors.text,
                                    fontSize: theme.typography.size.sm,
                                    paddingHorizontal: theme.spacing[8],
                                    paddingVertical: theme.spacing[4],
                                    borderRadius: theme.borderRadius.md,
                                    fontWeight: theme.typography.weights.medium,
                                }]}>
                                    {action.label}
                                </Text>
                                <Pressable
                                    style={[styles.actionButton, { backgroundColor: theme.colors.card, ...theme.shadows.md }]}
                                    onPress={() => {
                                        setIsOpen(false);
                                        expansion.value = withSpring(0);
                                        rotation.value = withTiming(0);
                                        action.onPress();
                                    }}
                                >
                                    {action.icon}
                                </Pressable>
                            </Animated.View>
                        );
                    })}
                </View>
            )}

            {/* Main FAB */}
            <AnimatedPressable
                onPress={handleMainPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[
                    styles.mainButton,
                    {
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.borderRadius.full,
                        paddingHorizontal: isExtended ? theme.spacing[20] : 0,
                        width: isExtended ? undefined : 56,
                        height: 56,
                        ...theme.shadows.lg,
                    },
                    mainAnimatedStyle
                ]}
            >
                {icon}
                {isExtended && (
                    <Text style={[styles.extendedLabel, { 
                        color: '#FFF', 
                        fontSize: theme.typography.size.base,
                        fontWeight: theme.typography.weights.semibold,
                    }]}>
                        {label}
                    </Text>
                )}
            </AnimatedPressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        alignItems: 'flex-end',
        zIndex: 100, // Ensure FAB stays above other content
    },
    mainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    extendedLabel: {
        marginLeft: 8,
    },
    actionsContainer: {
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        marginBottom: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionLabel: {
        marginRight: 12,
        overflow: 'hidden',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
