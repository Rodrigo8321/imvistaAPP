import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomTabNavigator } from './BottomTabNavigator';
import AssetDetailsScreen from '../screens/main/AssetDetailsScreen';
import TransactionHistoryScreen from '../screens/main/TransactionHistoryScreen';
import NewsScreen from '../screens/main/NewsScreen';
import GoalsScreen from '../screens/main/GoalsScreen';
import AIAnalysisScreen from '../screens/main/AIAnalysisScreen';
import StockComparisonScreen from '../screens/main/StockComparisonScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
        cardStyle: { backgroundColor: '#0f172a' }
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      <Stack.Screen
        name="AssetDetails"
        component={AssetDetailsScreen}
        options={{
          animationEnabled: true,
        }}
      />
      <Stack.Screen
        name="AssetManagement"
        component={TransactionHistoryScreen}
        options={{
          headerShown: true,
          title: 'Gestão de Ativos',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
        }}
      />
      <Stack.Screen
        name="News"
        component={NewsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AIAnalysis"
        component={AIAnalysisScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="StockComparison"
        component={StockComparisonScreen}
        options={{
          headerShown: true,
          title: 'Comparador de Ações',
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
};
