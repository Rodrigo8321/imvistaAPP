import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import BiometricService from '../services/BiometricService';

// 1. Cria o Contexto
const AuthContext = createContext();

/**
 * Provedor de Autenticação.
 * Este componente envolve a aplicação e fornece o contexto de autenticação
 * para todos os componentes filhos.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verifica se o usuário já está logado ao iniciar o app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (isAuthenticated) {
        // ✅ BIOMETRIA: Solicita autenticação se disponível
        const bioSuccess = await BiometricService.authenticate();

        if (bioSuccess) {
          const userData = await authService.getUser();
          setUser(userData);
        } else {
          // Se falhar na biometria, não loga (poderia redirecionar para senha)
          console.warn('Falha na autenticação biométrica');
          // Opcional: Deslogar para forçar login com senha
          // await authService.logout();
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 2. Cria o Hook customizado para usar o contexto facilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
