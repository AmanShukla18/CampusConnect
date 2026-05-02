import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withRepeat, 
    withTiming, 
    Easing,
    interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

export type SkeletonVariant = 'text' | 'card' | 'avatar' | 'list-item';

interface SkeletonLoaderProps {
    variant?: SkeletonVariant;
    width?: DimensionValue;
    height?: DimensionValue;
    style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'text',
    width,
    height,
    style,
}) => {
    const { theme, isDark } = useTheme();
    const shimmerValue = useSharedValue(0);

    useEffect(() => {
        shimmerValue.value = withRepeat(
            withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [shimmerValue]);

    const shimmerStyle = useAnimatedStyle(() => {
        // Base colors based on theme
        const color1 = isDark ? '#2D2D4A' : '#E5E7EB';
        const color2 = isDark ? '#3F3F6A' : '#F3F4F6';
        
        return {
            backgroundColor: interpolateColor(
                shimmerValue.value,
                [0, 1],
                [color1, color2]
            )
        };
    });

    const getLayout = (): ViewStyle => {
        switch (variant) {
            case 'avatar':
                const d = typeof width === 'number' ? width : 40;
                return { width: d, height: d, borderRadius: d / 2 };
            case 'card':
                return { 
                    width: width || '100%', 
                    height: height || 150, 
                    borderRadius: theme.borderRadius.lg 
                };
            case 'list-item':
                return { 
                    width: width || '100%', 
                    height: height || 60, 
                    borderRadius: theme.borderRadius.md 
                };
            case 'text':
            default:
                return { 
                    width: width || '100%', 
                    height: height || 16, 
                    borderRadius: theme.borderRadius.sm 
                };
        }
    };

    return (
        <Animated.View style={[styles.base, getLayout(), shimmerStyle, style]} />
    );
};

const styles = StyleSheet.create({
    base: {
        overflow: 'hidden',
    }
});
