import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Button } from './Button';

export type EmptyStateVariant = 'no-data' | 'no-results' | 'no-connection' | 'error';

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title?: string;
    subtitle?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

const defaultContent: Record<EmptyStateVariant, { emoji: string, title: string, subtitle: string }> = {
    'no-data': {
        emoji: '📁',
        title: 'Nothing here yet',
        subtitle: 'It looks a bit empty. Create something to get started!'
    },
    'no-results': {
        emoji: '🔍',
        title: 'No results found',
        subtitle: 'We couldn\'t find anything matching your search. Try different keywords.'
    },
    'no-connection': {
        emoji: '📶',
        title: 'You\'re offline',
        subtitle: 'Please check your internet connection and try again.'
    },
    'error': {
        emoji: '⚠️',
        title: 'Something went wrong',
        subtitle: 'We encountered an unexpected error. Please try again later.'
    }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    variant = 'no-data',
    title,
    subtitle,
    actionLabel,
    onAction,
    icon,
    style,
}) => {
    const { theme } = useTheme();
    const defaults = defaultContent[variant];

    const displayTitle = title || defaults.title;
    const displaySubtitle = subtitle || defaults.subtitle;

    return (
        <View style={[styles.container, { padding: theme.spacing[24] }, style]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.cardBorder, borderRadius: theme.borderRadius.full }]}>
                {icon ? icon : <Text style={styles.emoji}>{defaults.emoji}</Text>}
            </View>
            <Text style={[styles.title, { 
                color: theme.colors.text, 
                fontSize: theme.typography.size.xl,
                fontWeight: theme.typography.weights.bold 
            }]}>
                {displayTitle}
            </Text>
            <Text style={[styles.subtitle, { 
                color: theme.colors.subText, 
                fontSize: theme.typography.size.base,
                marginTop: theme.spacing[8]
            }]}>
                {displaySubtitle}
            </Text>
            {actionLabel && onAction && (
                <View style={[styles.actionContainer, { marginTop: theme.spacing[24] }]}>
                    <Button 
                        title={actionLabel} 
                        onPress={onAction} 
                        variant={variant === 'error' || variant === 'no-connection' ? 'secondary' : 'primary'}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
    },
    iconContainer: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emoji: {
        fontSize: 48,
    },
    title: {
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        maxWidth: 280,
    },
    actionContainer: {
        width: '100%',
        maxWidth: 200,
    }
});
