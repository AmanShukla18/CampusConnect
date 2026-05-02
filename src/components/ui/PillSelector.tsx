import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ViewStyle, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface PillOption {
    id: string;
    label: string;
}

interface PillSelectorProps {
    options: PillOption[];
    selectedId: string;
    onSelect: (id: string) => void;
    style?: ViewStyle;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PillSelector: React.FC<PillSelectorProps> = ({
    options,
    selectedId,
    onSelect,
    style,
}) => {
    const { theme } = useTheme();
    const scrollRef = useRef<ScrollView>(null);
    
    // Track pill positions and widths
    const [pillLayouts, setPillLayouts] = useState<{ [key: string]: { x: number, width: number } }>({});
    
    // Animation for active background
    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    useEffect(() => {
        if (pillLayouts[selectedId]) {
            const { x, width } = pillLayouts[selectedId];
            
            indicatorX.value = withSpring(x, { damping: 20, stiffness: 200 });
            indicatorWidth.value = withSpring(width, { damping: 20, stiffness: 200 });
            
            // Scroll to keep selected visible
            if (scrollRef.current && x > SCREEN_WIDTH / 2) {
                scrollRef.current.scrollTo({ x: x - SCREEN_WIDTH / 2 + width / 2, animated: true });
            } else if (scrollRef.current) {
                scrollRef.current.scrollTo({ x: 0, animated: true });
            }
        }
    }, [selectedId, pillLayouts]);

    const handleLayout = (id: string, e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        setPillLayouts(prev => ({ ...prev, [id]: { x, width } }));
    };

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorX.value }],
            width: indicatorWidth.value,
        };
    });

    return (
        <View style={[styles.container, style]}>
            <View style={styles.scrollWrapper}>
                <ScrollView 
                    ref={scrollRef}
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* The animated moving background */}
                    <Animated.View style={[
                        styles.activeIndicator,
                        {
                            backgroundColor: theme.colors.primary,
                            borderRadius: theme.borderRadius.full,
                        },
                        indicatorStyle
                    ]} />

                    {options.map((option) => {
                        const isSelected = selectedId === option.id;
                        return (
                            <Pressable
                                key={option.id}
                                onPress={() => onSelect(option.id)}
                                onLayout={(e) => handleLayout(option.id, e)}
                                style={[
                                    styles.pill,
                                    {
                                        paddingHorizontal: theme.spacing[16],
                                        paddingVertical: theme.spacing[8],
                                        borderRadius: theme.borderRadius.full,
                                        borderColor: isSelected ? 'transparent' : theme.colors.cardBorder,
                                        borderWidth: 1,
                                    }
                                ]}
                            >
                                <Text style={[
                                    styles.pillText,
                                    {
                                        color: isSelected ? '#FFF' : theme.colors.subText,
                                        fontSize: theme.typography.size.sm,
                                        fontWeight: isSelected ? theme.typography.weights.semibold : theme.typography.weights.medium,
                                    }
                                ]}>
                                    {option.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 8,
    },
    scrollWrapper: {
        position: 'relative',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'center',
        flexDirection: 'row',
    },
    activeIndicator: {
        position: 'absolute',
        top: 4,
        height: 35, // matches approx height of padding+fontSize
        zIndex: 0,
    },
    pill: {
        marginRight: 8,
        zIndex: 1,
    },
    pillText: {
        textAlign: 'center',
    }
});
