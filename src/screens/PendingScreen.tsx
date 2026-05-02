import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function PendingScreen() {
    const { signOut, refreshProfile, userProfile } = useAuth();
    const { isDark, colors } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="time-outline" size={80} color="#f59e0b" style={{ marginBottom: 20 }} />
                <Text style={[styles.title, { color: colors.text }]}>Approval Pending</Text>
                <Text style={[styles.message, { color: colors.subText }]}>
                    Your teacher account request has been sent to the administrators.
                    Please wait for approval before accessing the platform.
                </Text>

                <View style={[styles.infoBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.infoText, { color: colors.subText }]}>Name: <Text style={[styles.bold, { color: colors.text }]}>{userProfile?.name}</Text></Text>
                    <Text style={[styles.infoText, { color: colors.subText }]}>Email: <Text style={[styles.bold, { color: colors.text }]}>{userProfile?.email}</Text></Text>
                    <Text style={[styles.infoText, { color: colors.subText }]}>Role: <Text style={[styles.bold, { color: colors.text }]}>{userProfile?.role}</Text></Text>
                </View>

                <TouchableOpacity style={styles.checkBtn} onPress={refreshProfile}>
                    <Text style={styles.checkBtnText}>Check Status</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
                    <Text style={styles.logoutBtnText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 24,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
        borderWidth: 1,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center'
    },
    message: {
        textAlign: 'center',
        marginBottom: 24,
        fontSize: 16,
        lineHeight: 24,
    },
    infoBox: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    infoText: {
        marginBottom: 6,
        fontSize: 15,
    },
    bold: {
        fontWeight: '700',
    },
    checkBtn: {
        backgroundColor: '#f59e0b',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
    },
    checkBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    logoutBtn: {
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
    },
    logoutBtnText: {
        color: '#ef4444',
        fontWeight: '700',
        fontSize: 16
    },
});
