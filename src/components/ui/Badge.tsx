import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export type BadgeVariant = 'filled' | 'outline' | 'soft';
export type BadgeColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    label: string | number;
    variant?: BadgeVariant;
    color?: BadgeColor;
    size?: BadgeSize;
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'filled',
    color = 'primary',
    size = 'sm',
    style,
}) => {
    const { theme } = useTheme();

    const getBaseColor = () => {
        if (color === 'neutral') return theme.colors.subText;
        return theme.colors[color as keyof typeof theme.colors] as string;
    };

    const getStyles = () => {
        const baseColor = getBaseColor();
        switch (variant) {
            case 'outline':
                return {
                    bg: 'transparent',
                    border: baseColor,
                    text: baseColor,
                };
            case 'soft':
                // For soft, we might want a translucent version of the primary color.
                // Reusing primaryLight or a hex opacity for simplicity
                return {
                    bg: `${baseColor}20`, // 20% opacity hex
                    border: 'transparent',
                    text: baseColor,
                };
            case 'filled':
            default:
                return {
                    bg: baseColor,
                    border: baseColor,
                    text: '#FFF',
                };
        }
    };

    const s = getStyles();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: s.bg,
                borderColor: s.border,
                borderWidth: variant === 'outline' ? 1 : 0,
                paddingHorizontal: size === 'sm' ? 6 : 10,
                paddingVertical: size === 'sm' ? 2 : 4,
                borderRadius: theme.borderRadius.full,
            },
            style
        ]}>
            <Text style={[
                styles.text,
                {
                    color: s.text,
                    fontSize: size === 'sm' ? theme.typography.size.xs : theme.typography.size.sm,
                    fontWeight: theme.typography.weights.semibold,
                }
            ]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'flex-start',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        textAlign: 'center',
    }
});
