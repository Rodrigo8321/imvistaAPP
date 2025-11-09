import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/screens/main/AuthContext'; // CORREÇÃO: Apontando para o local correto do arquivo
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    // Envolvemos tudo com o AuthProvider
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
