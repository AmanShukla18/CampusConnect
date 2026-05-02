import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    onLongPress?: () => void;
    withGradientHeader?: boolean;
    headerColors?: [string, string];
    elevation?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Card: React.FC<CardProps> = ({
    children, style, onPress, onLongPress,
    withGradientHeader = false,
    headerColors,
    elevation = 'sm'
}) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        if (onPress) scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
    };

    const handlePressOut = () => {
        if (onPress) scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    };

    const gradientColors = headerColors || [theme.colors.primaryLight, theme.colors.primaryDark];

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const CardContent = (
        <View style={{ flex: 1 }}>
            {withGradientHeader && (
                <LinearGradient
                    colors={gradientColors as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientHeader}
                />
            )}
            <View style={{ padding: theme.spacing[16], flex: 1 }}>
                {children}
            </View>
        </View>
    );

    const cardStyles = [
        styles.base,
        {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.cardBorder,
            borderRadius: theme.borderRadius.lg,
            ...theme.shadows[elevation],
        },
        style
    ];

    if (onPress || onLongPress) {
        return (
            <AnimatedPressable
                onPress={onPress}
                onLongPress={onLongPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={[...cardStyles, animatedStyle]}
            >
                {CardContent}
            </AnimatedPressable>
        );
    }

    return (
        <View style={cardStyles}>
            {CardContent}
        </View>
    );
};

const styles = StyleSheet.create({
    base: {
        borderWidth: 1,
        overflow: 'hidden',
        width: '100%',
    },
    gradientHeader: {
        height: 6,
        width: '100%',
    }
});
