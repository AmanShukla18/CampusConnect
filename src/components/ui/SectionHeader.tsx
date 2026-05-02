import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from './Badge';

interface SectionHeaderProps {
    title: string;
    onSeeAll?: () => void;
    seeAllLabel?: string;
    badgeCount?: number;
    style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    onSeeAll,
    seeAllLabel = 'See All',
    badgeCount,
    style,
}) => {
    const { theme } = useTheme();

    return (
        <View style={[styles.container, { marginBottom: theme.spacing[12] }, style]}>
            <View style={styles.leftContainer}>
                <Text style={[
                    styles.title,
                    {
                        color: theme.colors.text,
                        fontSize: theme.typography.size.lg,
                        fontWeight: theme.typography.weights.bold,
                    }
                ]}>
                    {title}
                </Text>
                {badgeCount !== undefined && (
                    <Badge label={badgeCount} color="primary" variant="soft" style={{ marginLeft: 8 }} />
                )}
            </View>
            
            {onSeeAll && (
                <Pressable onPress={onSeeAll} hitSlop={10}>
                    <Text style={[
                        styles.seeAllText,
                        {
                            color: theme.colors.primary,
                            fontSize: theme.typography.size.sm,
                            fontWeight: theme.typography.weights.semibold,
                        }
                    ]}>
                        {seeAllLabel}
                    </Text>
                </Pressable>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        // base styles
    },
    seeAllText: {
        // base styles
    }
});
