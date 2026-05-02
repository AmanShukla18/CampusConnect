import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../context/ThemeContext';

interface Tab {
    id: string;
    label: string;
}

interface TabBarProps {
    tabs: Tab[];
    activeTabId: string;
    onTabChange: (id: string) => void;
    style?: ViewStyle;
}

export const TabBar: React.FC<TabBarProps> = ({
    tabs,
    activeTabId,
    onTabChange,
    style,
}) => {
    const { theme } = useTheme();
    
    // We store the width of each tab to calculate the sliding indicator position
    const [tabWidths, setTabWidths] = useState<{ [key: string]: number }>({});
    
    const indicatorX = useSharedValue(0);
    const indicatorWidth = useSharedValue(0);

    const activeIndex = tabs.findIndex(t => t.id === activeTabId);

    useEffect(() => {
        let xPos = 0;
        for (let i = 0; i < activeIndex; i++) {
            xPos += (tabWidths[tabs[i].id] || 0);
        }
        
        const currentWidth = tabWidths[activeTabId] || 0;

        if (currentWidth > 0) {
            indicatorX.value = withSpring(xPos, { damping: 15, stiffness: 150 });
            indicatorWidth.value = withSpring(currentWidth, { damping: 15, stiffness: 150 });
        }
    }, [activeTabId, tabWidths, tabs, activeIndex]);

    const handleLayout = (id: string, e: LayoutChangeEvent) => {
        const { width } = e.nativeEvent.layout;
        setTabWidths(prev => ({ ...prev, [id]: width }));
    };

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: indicatorX.value }],
            width: indicatorWidth.value,
            backgroundColor: theme.colors.primary,
        };
    });

    return (
        <View style={[styles.container, { borderBottomColor: theme.colors.cardBorder }, style]}>
            <View style={styles.tabsRow}>
                {tabs.map((tab) => {
                    const isActive = activeTabId === tab.id;
                    return (
                        <Pressable
                            key={tab.id}
                            onPress={() => onTabChange(tab.id)}
                            onLayout={(e) => handleLayout(tab.id, e)}
                            style={[styles.tab, { paddingVertical: theme.spacing[12], paddingHorizontal: theme.spacing[16] }]}
                        >
                            <Animated.Text style={[
                                styles.tabText,
                                {
                                    color: isActive ? theme.colors.primary : theme.colors.subText,
                                    fontSize: theme.typography.size.base,
                                    fontWeight: isActive ? theme.typography.weights.bold : theme.typography.weights.medium,
                                }
                            ]}>
                                {tab.label}
                            </Animated.Text>
                        </Pressable>
                    );
                })}
            </View>
            <Animated.View style={[styles.indicator, indicatorStyle]} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        borderBottomWidth: 1.5,
        position: 'relative',
    },
    tabsRow: {
        flexDirection: 'row',
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        textAlign: 'center',
    },
    indicator: {
        position: 'absolute',
        bottom: -1.5,
        height: 3,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    }
});
