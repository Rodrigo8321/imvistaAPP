import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../styles/colors';

import DashboardScreen from '../screens/main/DashboardScreen';
import PortfolioScreen from '../screens/main/PortfolioScreen';
import AnalysisScreen from '../screens/main/AnalysisScreen';
import WatchlistScreen from '../screens/main/WatchlistScreen';
import TransactionHistoryScreen from '../screens/main/TransactionHistoryScreen'; // ← ADICIONAR
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

// Componente de Ícone
const TabIcon = ({ name, focused }) => {
  const icons = {
    Dashboard: { default: '📊', focused: '📈' },
    Portfolio: { default: '💼', focused: '💰' },
    Watchlist: { default: '⭐', focused: '🌟' },
    Transactions: { default: '📋', focused: '📝' }, // ← ADICIONAR
    Analysis: { default: '🔍', focused: '🎯' },
    Settings: { default: '⚙️', focused: '⚙' },
  };

  const icon = focused ? icons[name].focused : icons[name].default;

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icon}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
};

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{ tabBarLabel: 'Início' }}
      />
      
      <Tab.Screen
        name="Portfolio"
        component={PortfolioScreen}
        options={{ tabBarLabel: 'Portfólio' }}
      />

      <Tab.Screen
        name="Watchlist"
        component={WatchlistScreen}
        options={{ tabBarLabel: 'Favoritos' }}
      />

      <Tab.Screen
        name="Transactions"
        component={TransactionHistoryScreen}
        options={{ tabBarLabel: 'Transações' }}
      />

      <Tab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{ tabBarLabel: 'Análise' }}
      />
      
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Config' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 40,
  },
  iconContainerFocused: {
    transform: [{ scale: 1.05 }],
  },
  icon: {
    fontSize: 24,
  },
  iconFocused: {
    fontSize: 26,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
