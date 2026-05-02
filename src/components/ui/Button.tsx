import React from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    title, onPress, variant = 'primary', size = 'md',
    disabled = false, loading = false, icon, style, textStyle, fullWidth = true
}) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        if (!disabled && !loading) {
            scale.value = withSpring(0.96, { damping: 10, stiffness: 200 });
        }
    };

    const handlePressOut = () => {
        if (!disabled && !loading) {
            scale.value = withSpring(1, { damping: 10, stiffness: 200 });
        }
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
        }
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const getColors = () => {
        switch (variant) {
            case 'primary': return { bg: theme.colors.primary, text: '#FFF', border: theme.colors.primary };
            case 'secondary': return { bg: theme.colors.secondary, text: '#FFF', border: theme.colors.secondary };
            case 'danger': return { bg: theme.colors.danger, text: '#FFF', border: theme.colors.danger };
            case 'outline': return { bg: 'transparent', text: theme.colors.primary, border: theme.colors.primary };
            case 'ghost': return { bg: 'transparent', text: theme.colors.primary, border: 'transparent' };
            default: return { bg: theme.colors.primary, text: '#FFF', border: theme.colors.primary };
        }
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { px: theme.spacing[12], py: theme.spacing[6] };
            case 'lg': return { px: theme.spacing[32], py: theme.spacing[16] };
            case 'md': default: return { px: theme.spacing[24], py: theme.spacing[12] };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return theme.typography.size.sm;
            case 'lg': return theme.typography.size.lg;
            case 'md': default: return theme.typography.size.base;
        }
    };

    const c = getColors();
    const p = getPadding();

    return (
        <AnimatedPressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            style={[
                styles.base,
                {
                    backgroundColor: c.bg,
                    borderColor: c.border,
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                    paddingHorizontal: p.px,
                    paddingVertical: p.py,
                    borderRadius: theme.borderRadius.xl, // full pill look usually
                    opacity: disabled ? 0.6 : 1,
                    alignSelf: fullWidth ? 'stretch' : 'flex-start',
                },
                animatedStyle,
                style
            ]}
        >
            {loading ? (
                <ActivityIndicator color={c.text} />
            ) : (
                <>
                    {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
                    <Text style={[{
                        color: c.text,
                        fontSize: getFontSize(),
                        fontWeight: theme.typography.weights.semibold,
                    }, textStyle]}>
                        {title}
                    </Text>
                </>
            )}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    iconContainer: {
        marginRight: 8,
    }
});
