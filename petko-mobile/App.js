import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen     from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import POSScreen       from './src/screens/POSScreen';
import InventoryScreen from './src/screens/InventoryScreen';
import LowStockScreen  from './src/screens/LowStockScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import { colors } from './src/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

import { MaterialCommunityIcons } from '@expo/vector-icons';

const TAB_ICONS = {
  Dashboard: { name: 'chart-line',             color: colors.primary },
  POS:       { name: 'cart-outline',            color: colors.primary },
  Inventory: { name: 'package-variant-closed',  color: colors.primary },
  LowStock:  { name: 'alert-circle-outline',    color: colors.primary },
  Profile:   { name: 'account-outline',         color: colors.primary },
};

function TabIcon({ name, focused }) {
  const icon = TAB_ICONS[name];
  return (
    <MaterialCommunityIcons
      name={icon.name}
      size={24}
      color={focused ? colors.primary : colors.muted}
    />
  );
}

function AppTabs() {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle:      { borderTopColor: '#f0e8d8', paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        headerStyle:      { backgroundColor: colors.primary },
        headerTintColor:  '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 18 },
      })}
    >
      {isAdmin && (
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: '🐾 PetKO', tabBarLabel: 'Dashboard' }}
        />
      )}
      <Tab.Screen name="POS"       component={POSScreen}       options={{ tabBarLabel: 'POS' }} />
      <Tab.Screen name="Inventory" component={InventoryScreen} options={{ tabBarLabel: 'Inventory' }} />
      <Tab.Screen name="LowStock"  component={LowStockScreen}  options={{ tabBarLabel: 'Low Stock', title: 'Low Stock' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <Text style={{ fontSize: 40, marginBottom: 12 }}>🐾</Text>
        <ActivityIndicator color={colors.primary} size={36} />
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
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
