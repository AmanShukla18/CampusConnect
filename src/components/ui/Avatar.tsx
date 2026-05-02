import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarRole = 'admin' | 'teacher' | 'student';

interface AvatarProps {
    src?: string | null;
    name?: string;
    size?: AvatarSize;
    isOnline?: boolean;
    role?: AvatarRole;
    style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
};

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name = 'Unknown',
    size = 'md',
    isOnline = false,
    role,
    style,
}) => {
    const { theme } = useTheme();
    const d = sizeMap[size];

    const pulseScale = useSharedValue(1);

    React.useEffect(() => {
        if (isOnline) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        }
    }, [isOnline, pulseScale]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const getInitials = (n: string) => {
        const parts = n.split(' ');
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return n.substring(0, 2).toUpperCase();
    };

    const getRoleColor = () => {
        switch (role) {
            case 'admin': return theme.colors.danger;
            case 'teacher': return theme.colors.warning;
            case 'student': return theme.colors.primary;
            default: return theme.colors.secondary;
        }
    };

    return (
        <View style={[styles.container, { width: d, height: d }, style]}>
            {src ? (
                <Image source={{ uri: src }} style={[styles.image, { borderRadius: d / 2 }]} />
            ) : (
                <View style={[styles.placeholder, { backgroundColor: theme.colors.primaryLight, borderRadius: d / 2 }]}>
                    <Text style={[styles.initials, { fontSize: d * 0.4, color: theme.colors.primaryDark }]}>
                        {getInitials(name)}
                    </Text>
                </View>
            )}

            {isOnline && (
                <Animated.View style={[
                    styles.onlineDot,
                    {
                        backgroundColor: theme.colors.success,
                        width: d * 0.25,
                        height: d * 0.25,
                        borderRadius: (d * 0.25) / 2,
                        bottom: d * 0.05,
                        right: d * 0.05,
                        borderWidth: 2,
                        borderColor: theme.colors.card,
                    },
                    pulseStyle
                ]} />
            )}

            {role && (
                <View style={[
                    styles.roleBadge,
                    {
                        backgroundColor: getRoleColor(),
                        width: d * 0.35,
                        height: d * 0.35,
                        borderRadius: (d * 0.35) / 2,
                        bottom: -d * 0.05,
                        right: isOnline ? undefined : -d * 0.05,
                        left: isOnline ? -d * 0.05 : undefined,
                        borderWidth: 2,
                        borderColor: theme.colors.card,
                    }
                ]}>
                    <Text style={styles.roleText}>{role[0].toUpperCase()}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontWeight: 'bold',
    },
    onlineDot: {
        position: 'absolute',
    },
    roleBadge: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    roleText: {
        color: '#FFF',
        fontSize: 8,
        fontWeight: 'bold',
    }
});
