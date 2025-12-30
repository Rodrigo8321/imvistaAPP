import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import colors from '../styles/colors';

import DashboardScreen from '../screens/main/DashboardScreen';
import PortfolioScreen from '../screens/main/PortfolioScreen';
import DividendsScreen from '../screens/main/DividendsScreen';
import MarketScreen from '../screens/main/MarketScreen';
import AIAnalysisScreen from '../screens/main/AIAnalysisScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator();

// Componente de Ícone
const TabIcon = ({ name, focused }) => {
  const icons = {
    Dashboard: { default: '📊', focused: '📈' },
    Portfolio: { default: '💼', focused: '💰' },
    Dividends: { default: '💲', focused: '💵' },
    Market: { default: '🌐', focused: '🌎' },
    AIGuru: { default: '✨', focused: '🪄' },
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

import HapticsService from '../services/HapticsService';

// ... imports

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderTopWidth: 0,
          height: 70,
          paddingBottom: 0,
          // Shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 3.5,
          elevation: 5,
        },
        tabBarItemStyle: {
          height: 70,
          padding: 5,
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
      screenListeners={{
        tabPress: () => {
          HapticsService.light();
        },
      }}
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
        name="Dividends"
        component={DividendsScreen}
        options={{ tabBarLabel: 'Proventos' }}
      />

      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{ tabBarLabel: 'Mercado' }}
      />

      <Tab.Screen
        name="AIGuru"
        component={AIAnalysisScreen}
        options={{ tabBarLabel: 'Guru IA' }}
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
