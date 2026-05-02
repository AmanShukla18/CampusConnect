import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface DividerProps {
    orientation?: 'horizontal' | 'vertical';
    label?: string;
    style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
    orientation = 'horizontal',
    label,
    style,
}) => {
    const { theme } = useTheme();

    const isHorizontal = orientation === 'horizontal';
    
    const lineColor = theme.colors.cardBorder;
    
    if (label) {
        if (!isHorizontal) {
            console.warn('Divider: Label is only supported for horizontal orientation');
        }
        
        return (
            <View style={[styles.horizontalContainer, { marginVertical: theme.spacing[16] }, style]}>
                <View style={[styles.line, { backgroundColor: lineColor, height: 1 }]} />
                <Text style={[
                    styles.label,
                    {
                        color: theme.colors.subText,
                        fontSize: theme.typography.size.sm,
                        fontWeight: theme.typography.weights.medium,
                        paddingHorizontal: theme.spacing[12],
                    }
                ]}>
                    {label}
                </Text>
                <View style={[styles.line, { backgroundColor: lineColor, height: 1 }]} />
            </View>
        );
    }

    if (isHorizontal) {
        return <View style={[styles.horizontalLine, { backgroundColor: lineColor, marginVertical: theme.spacing[16] }, style]} />;
    }

    return <View style={[styles.verticalLine, { backgroundColor: lineColor, marginHorizontal: theme.spacing[16] }, style]} />;
};

const styles = StyleSheet.create({
    horizontalContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    line: {
        flex: 1,
    },
    label: {
        textAlign: 'center',
    },
    horizontalLine: {
        height: 1,
        width: '100%',
    },
    verticalLine: {
        width: 1,
        height: '100%',
    }
});
