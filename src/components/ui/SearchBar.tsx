import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable, NativeSyntheticEvent, TextInputFocusEventData, ViewStyle } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    Easing,
    interpolateColor
} from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo vector icons are available

interface SearchBarProps {
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    style?: ViewStyle;
    debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value = '',
    onChangeText,
    placeholder = 'Search...',
    onFocus,
    onBlur,
    style,
    debounceMs = 300,
}) => {
    const { theme } = useTheme();
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    
    const focusAnim = useSharedValue(0);

    // Sync external value
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Cleanup for debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (onChangeText && localValue !== value) {
                onChangeText(localValue);
            }
        }, debounceMs);

        return () => clearTimeout(handler);
    }, [localValue, debounceMs, onChangeText, value]);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        focusAnim.value = withSpring(1, { damping: 20, stiffness: 200 });
        if (onFocus) onFocus();
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        focusAnim.value = withSpring(0, { damping: 20, stiffness: 200 });
        if (onBlur) onBlur();
    };

    const clearText = () => {
        setLocalValue('');
        if (onChangeText) onChangeText('');
    };

    const containerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: 1 + focusAnim.value * 0.02 }],
            borderColor: interpolateColor(
                focusAnim.value,
                [0, 1],
                [theme.colors.cardBorder, theme.colors.primary]
            )
        };
    });

    return (
        <Animated.View style={[
            styles.container,
            {
                backgroundColor: theme.colors.inputBg,
                borderRadius: theme.borderRadius.full,
                borderWidth: 1.5,
                borderColor: theme.colors.cardBorder,
            },
            containerAnimatedStyle,
            style
        ]}>
            <Ionicons name="search" size={20} color={isFocused ? theme.colors.primary : theme.colors.subText} style={styles.icon} />
            <TextInput
                value={localValue}
                onChangeText={setLocalValue}
                placeholder={placeholder}
                placeholderTextColor={theme.colors.subText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={[styles.input, { color: theme.colors.text, fontSize: theme.typography.size.base }]}
            />
            {localValue.length > 0 && (
                <Pressable onPress={clearText} style={styles.clearButton} hitSlop={10}>
                    <View style={[styles.clearCircle, { backgroundColor: theme.colors.subText }]}>
                        <Ionicons name="close" size={14} color={theme.colors.background} />
                    </View>
                </Pressable>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        width: '100%',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: 24,
    },
    clearButton: {
        marginLeft: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clearCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
