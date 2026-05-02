import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from './Avatar';
import { Ionicons } from '@expo/vector-icons';
import { Divider } from './Divider';

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { userProfile, signOut } = useAuth();
    const { theme, isDark } = useTheme();

    return (
        <DrawerContentScrollView 
            {...props} 
            contentContainerStyle={{ flexGrow: 1, backgroundColor: theme.colors.background }}
        >
            {/* Header Profile Section */}
            <View style={[styles.profileSection, { borderBottomColor: theme.colors.cardBorder }]}>
                <Avatar 
                    src={userProfile?.photoUrl} 
                    name={userProfile?.name || 'User'} 
                    size="lg" 
                    role={userProfile?.role as any}
                    isOnline={true}
                />
                <Text style={[styles.nameText, { color: theme.colors.text, fontSize: theme.typography.size.lg, fontWeight: theme.typography.weights.bold }]}>
                    {userProfile?.name || 'Guest User'}
                </Text>
                <Text style={[styles.emailText, { color: theme.colors.subText, fontSize: theme.typography.size.sm }]}>
                    {userProfile?.email || 'guest@campus.com'}
                </Text>
                {userProfile?.school && (
                    <Text style={[styles.schoolText, { color: theme.colors.primary, fontSize: theme.typography.size.xs, fontWeight: theme.typography.weights.semibold }]}>
                        {userProfile.school}
                    </Text>
                )}
            </View>

            {/* Menu Items */}
            <View style={styles.menuSection}>
                {props.state.routes.map((route, index) => {
                    const isFocused = props.state.index === index;
                    const { options } = props.descriptors[route.key];
                    const label = options.drawerLabel !== undefined 
                        ? options.drawerLabel 
                        : options.title !== undefined 
                            ? options.title 
                            : route.name;

                    const icon = options.drawerIcon 
                        ? options.drawerIcon({ focused: isFocused, color: isFocused ? theme.colors.primary : theme.colors.subText, size: 22 })
                        : null;

                    return (
                        <Pressable
                            key={route.key}
                            onPress={() => props.navigation.navigate(route.name)}
                            style={[
                                styles.menuItem,
                                isFocused && { backgroundColor: `${theme.colors.primary}15` } // 15% opacity primary
                            ]}
                        >
                            {isFocused && (
                                <View style={[styles.activeIndicator, { backgroundColor: theme.colors.primary }]} />
                            )}
                            <View style={styles.menuItemContent}>
                                {icon && <View style={styles.iconContainer}>{icon}</View>}
                                <Text style={[
                                    styles.menuItemLabel,
                                    {
                                        color: isFocused ? theme.colors.primary : theme.colors.text,
                                        fontWeight: isFocused ? theme.typography.weights.bold : theme.typography.weights.medium,
                                        fontSize: theme.typography.size.base,
                                    }
                                ]}>
                                    {label as string}
                                </Text>
                            </View>
                        </Pressable>
                    );
                })}
            </View>

            <View style={{ flex: 1 }} />

            {/* Footer */}
            <View style={styles.footerSection}>
                <Divider />
                <Pressable 
                    onPress={signOut}
                    style={[styles.logoutButton, { backgroundColor: `${theme.colors.danger}15` }]}
                >
                    <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} style={{ marginRight: 8 }} />
                    <Text style={{ color: theme.colors.danger, fontWeight: theme.typography.weights.semibold }}>
                        Sign Out
                    </Text>
                </Pressable>
                
                <Text style={[styles.versionText, { color: theme.colors.subText, fontSize: theme.typography.size.xs }]}>
                    CampusConnect v1.0.0
                </Text>
            </View>
        </DrawerContentScrollView>
    );
};

const styles = StyleSheet.create({
    profileSection: {
        padding: 20,
        paddingTop: 40, // Account for notch if needed, though DrawerContentScrollView handles some
        alignItems: 'center',
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    nameText: {
        marginTop: 12,
        marginBottom: 2,
    },
    emailText: {
        marginBottom: 4,
    },
    schoolText: {
        marginTop: 4,
    },
    menuSection: {
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginVertical: 4,
        marginHorizontal: 16,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    activeIndicator: {
        position: 'absolute',
        left: 0,
        top: '20%',
        bottom: '20%',
        width: 4,
        borderRadius: 2,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
    },
    iconContainer: {
        width: 28,
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemLabel: {
        // base
    },
    footerSection: {
        padding: 16,
        paddingBottom: 32,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    versionText: {
        textAlign: 'center',
    }
});
