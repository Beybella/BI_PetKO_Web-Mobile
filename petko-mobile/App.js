import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Image } from 'react-native';
import * as Font from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen     from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import POSScreen       from './src/screens/POSScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import LowStockScreen  from './src/screens/LowStockScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import UsersScreen     from './src/screens/UsersScreen';
import { colors, darkColors } from './src/theme';
import { API_BASE } from './src/config';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Dashboard: 'chart-line',
  POS:       'cart-outline',
  Inventory: 'package-variant-closed',
  LowStock:  'alert-circle-outline',
  Users:     'account-group-outline',
  Profile:   'account-outline',
};

function AppTabs() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const c = dark ? darkColors : colors;
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => (
          <MaterialCommunityIcons
            name={TAB_ICONS[route.name]}
            size={24}
            color={focused ? c.primary : c.muted}
          />
        ),
        tabBarActiveTintColor:   c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle:      { borderTopColor: c.border, backgroundColor: c.card, paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        headerStyle:      { backgroundColor: c.card },
        headerTintColor:  c.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: c.text },
        headerLeft: () => (
          <Image
            source={{ uri: `${API_BASE}/logo.png` }}
            style={{ width: 80, height: 28, marginLeft: 12 }}
            resizeMode="contain"
          />
        ),
      })}
    >
      {isAdmin && <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard', title: '' }} />}
      <Tab.Screen name="POS"       component={POSScreen}       options={{ tabBarLabel: 'POS',       title: 'POS' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarLabel: 'Inventory', title: 'Inventory' }} />
      <Tab.Screen name="LowStock"  component={LowStockScreen}  options={{ tabBarLabel: 'Low Stock', title: 'Low Stock' }} />
      {isAdmin && <Tab.Screen name="Users" component={UsersScreen} options={{ tabBarLabel: 'Users', title: 'Users' }} />}
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ tabBarLabel: 'Profile',   title: 'Profile' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  const { dark } = useTheme();
  const c = dark ? darkColors : colors;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <Image source={{ uri: `${API_BASE}/logo.png` }} style={{ width: 120, height: 48, marginBottom: 20 }} resizeMode="contain" />
        <ActivityIndicator color={c.primary} size={36} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={AppTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      ...MaterialCommunityIcons.font,
    }).then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF7' }}>
        <ActivityIndicator color="#D4900A" size={36} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
