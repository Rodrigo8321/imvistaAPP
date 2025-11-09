import React from 'react';
import { useAuth } from '../screens/main/AuthContext'; // CORREÇÃO: Apontando para o local correto do arquivo
import LoadingScreen from '../screens/LoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

const RootNavigator = () => {
  const { user, isLoading } = useAuth();

  // Enquanto o app verifica se o usuário está logado, mostramos uma tela de loading.
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Se não há usuário, mostra o fluxo de autenticação.
  // Se há um usuário, mostra o fluxo principal do app.
  return (
    user ? <AppNavigator /> : <AuthNavigator />
  );
};

export default RootNavigator;
