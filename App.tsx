import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, DrawerActions } from '@react-navigation/native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme, View, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Screens
import NoticesScreen from './src/screens/NoticesScreen';
import LostFoundScreen from './src/screens/LostFoundScreen';
import StudyGroupsScreen from './src/screens/StudyGroupsScreen';
import GroupChatScreen from './src/screens/GroupChatScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';
import EventHubScreen from './src/screens/EventHubScreen';
import ApprovalDashboardScreen from './src/screens/ApprovalDashboardScreen';
import NotificationBell from './src/components/NotificationBell';
import SettingsScreen from './src/screens/SettingsScreen';
import LoginScreen from './src/screens/LoginScreen';
import GetStartedScreen from './src/screens/GetStartedScreen';
import SignupScreen from './src/screens/SignupScreen';
import ReportFoundScreen from './src/screens/ReportFoundScreen';
import UploadResourceScreen from './src/screens/UploadResourceScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminTeacherListScreen from './src/screens/AdminTeacherListScreen';
import PendingScreen from './src/screens/PendingScreen';
import RejectedScreen from './src/screens/RejectedScreen';
import SearchScreen from './src/screens/SearchScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AboutScreen from './src/screens/AboutScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';

import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { CustomDrawerContent } from './src/components/ui/CustomDrawerContent';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

function MainDrawer() {
  const { userProfile } = useAuth(); // Get userProfile for role check
  const { colors, isDark } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName={userProfile?.role === 'admin' ? "AdminDashboardStack" : "Notices"}
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={({ navigation }: any) => ({
        headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' },
        headerTintColor: '#fff',
        headerRight: () => <NotificationBell />,
        drawerActiveBackgroundColor: isDark ? '#1e293b' : '#16233a',
        drawerActiveTintColor: '#dbe5ff',
        drawerInactiveTintColor: isDark ? '#94a3b8' : '#c8d0e0',
        drawerStyle: { backgroundColor: colors.background },
      })}
    >
      {/* Admin Dashboard - visible only to role 'admin' */}
      {userProfile?.role === 'admin' && (
        <Drawer.Screen
          name="AdminDashboardStack"
          component={AdminStack}
          options={{
            title: 'Admin Dashboard',
            drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="shield-checkmark-outline" color={color} size={size} />),
            headerShown: false // Stack handles header
          }}
        />
      )}

      <Drawer.Screen name="Notices" component={NoticesScreen} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="notifications-outline" color={color} size={size} />) }} />
      <Drawer.Screen name="Lost & Found" component={LostFoundScreen} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="search-outline" color={color} size={size} />) }} />
      <Drawer.Screen name="Study Groups" component={StudyGroupsScreen} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="people-outline" color={color} size={size} />) }} />
      <Drawer.Screen name="Resources" component={ResourcesScreen} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="folder-outline" color={color} size={size} />) }} />
      <Drawer.Screen name="Event Hub" component={EventHubStack} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="rocket-outline" color={color} size={size} />), headerShown: false }} />
      <Drawer.Screen name="Settings" component={SettingsScreen} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="settings-outline" color={color} size={size} />) }} />
      <Drawer.Screen name="About Us" component={AboutScreen} options={{ drawerIcon: ({ color, size }: { color: string, size: number }) => (<Ionicons name="information-circle-outline" color={color} size={size} />) }} />
    </Drawer.Navigator>
  );
}

function EventHubStack() {
  const { isDark } = useTheme();
  return (
    <Stack.Navigator screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' },
      headerTintColor: '#fff',
      headerRight: () => <NotificationBell />,
    }}>
      <Stack.Screen
        name="EventHubMain"
        component={EventHubScreen}
        options={({ navigation }: any) => ({
          title: 'Event Hub',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={{ marginRight: 16 }}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="ApprovalDashboard"
        component={ApprovalDashboardScreen}
        options={{ title: 'Approval Dashboard' }}
      />
    </Stack.Navigator>
  );
}

function AuthStack({ initialRoute }: { initialRoute: string }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute as any}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="GetStarted" component={GetStartedScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  const { isDark } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainDrawer} />
      <Stack.Screen name="GroupChat" component={GroupChatScreen as any} options={{ headerShown: true, title: 'Chat', headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="ReportFound" component={ReportFoundScreen} options={{ headerShown: true, title: 'Report Lost/Found Item', headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="UploadResource" component={UploadResourceScreen} options={{ headerShown: true, title: 'Upload Resource', headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ headerShown: true, title: 'Edit Profile', headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  const { isDark } = useTheme();
  return (
    <Stack.Navigator screenOptions={{
      headerShown: true,
      headerStyle: { backgroundColor: isDark ? '#0f172a' : '#0b1220' },
      headerTintColor: '#fff'
    }}>
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={({ navigation }: any) => ({
          title: 'Admin Dashboard',
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())} style={{ marginRight: 16 }}>
              <Ionicons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen name="AdminTeacherList" component={AdminTeacherListScreen} options={{ title: 'Pending Teachers' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { email, isLoading, role, userProfile } = useAuth();
  const { isDark } = useTheme();
  const [hasSeenOnboarding, setHasSeenOnboarding] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    import('@react-native-async-storage/async-storage').then(module => {
      module.default.getItem('hasSeenOnboarding').then(value => {
        setHasSeenOnboarding(value === 'true');
      });
    });
  }, []);

  if (isLoading || hasSeenOnboarding === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b5bfd" />
      </View>
    );
  }

  // Gate access based on Status
  if (email && userProfile) {
    if (userProfile.status === 'rejected') {
      return <RejectedScreen />;
    }
    if (userProfile.role === 'teacher' && userProfile.status === 'pending') {
      return <PendingScreen />;
    }
  }

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {email ? <MainStack /> : <AuthStack initialRoute={hasSeenOnboarding ? 'GetStarted' : 'Onboarding'} />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  drawerLogout: { backgroundColor: '#ffeef0', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
});





