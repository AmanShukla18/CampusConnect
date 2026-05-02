import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, KeyboardTypeOptions, ReturnKeyTypeOptions, NativeSyntheticEvent, TextInputFocusEventData, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface InputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    returnKeyType?: ReturnKeyTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconPress?: () => void;
    onFocus?: (e: any) => void;
    onBlur?: (e: any) => void;
}

export const Input: React.FC<InputProps> = ({
    label, value, onChangeText, placeholder, secureTextEntry,
    keyboardType, returnKeyType, autoCapitalize = 'none',
    multiline, numberOfLines, maxLength, error,
    leftIcon, rightIcon, onRightIconPress,
    onFocus, onBlur,
}) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);
    
    // Animation states
    const isActived = isFocused || value.length > 0;
    const focusAnim = useSharedValue(isActived ? 1 : 0);

    useEffect(() => {
        focusAnim.value = withTiming(isActived ? 1 : 0, {
            duration: 200,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
        });
    }, [isActived, focusAnim]);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    const labelStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: focusAnim.value * -24 },
                { scale: 1 - focusAnim.value * 0.15 }
            ],
            color: interpolateColor(
                focusAnim.value,
                [0, 1],
                [theme.colors.subText, error ? theme.colors.danger : theme.colors.primary]
            )
        };
    });

    const borderColor = error ? theme.colors.danger : isFocused ? theme.colors.primary : theme.colors.cardBorder;

    return (
        <View style={styles.container}>
            <View style={[
                styles.inputContainer,
                { 
                    backgroundColor: theme.colors.inputBg,
                    borderColor: borderColor,
                    borderRadius: theme.borderRadius.md,
                    minHeight: multiline ? 100 : 56,
                }
            ]}>
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
                <View style={styles.innerContainer}>
                    <Animated.Text style={[styles.label, { fontSize: theme.typography.size.base }, labelStyle]}>
                        {label}
                    </Animated.Text>
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={isFocused ? placeholder : ''}
                        placeholderTextColor={theme.colors.subText}
                        secureTextEntry={secureTextEntry}
                        keyboardType={keyboardType}
                        returnKeyType={returnKeyType}
                        autoCapitalize={autoCapitalize}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        maxLength={maxLength}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={[
                            styles.input,
                            { 
                                color: theme.colors.text, 
                                fontSize: theme.typography.size.base,
                                paddingTop: multiline ? 24 : 16,
                            }
                        ]}
                    />
                </View>
                {rightIcon && (
                    <Pressable onPress={onRightIconPress} style={styles.rightIcon} disabled={!onRightIconPress}>
                        {rightIcon}
                    </Pressable>
                )}
            </View>
            <View style={styles.footer}>
                {error ? (
                    <Text style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.typography.size.sm }]}>
                        {error}
                    </Text>
                ) : <View />}
                {maxLength && (
                    <Text style={[styles.charCount, { color: theme.colors.subText, fontSize: theme.typography.size.xs }]}>
                        {value.length}/{maxLength}
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        paddingHorizontal: 12,
    },
    innerContainer: {
        flex: 1,
        position: 'relative',
        justifyContent: 'center',
    },
    label: {
        position: 'absolute',
        left: 0,
        top: 18,
    },
    input: {
        flex: 1,
        paddingBottom: 8,
        minHeight: 56,
        textAlignVertical: 'top',
    },
    leftIcon: {
        marginRight: 10,
    },
    rightIcon: {
        marginLeft: 10,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
        paddingHorizontal: 4,
    },
    errorText: {
        flex: 1,
    },
    charCount: {
        marginLeft: 10,
    }
});
