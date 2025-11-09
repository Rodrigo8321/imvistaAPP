import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../../services/authService';

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
    const checkAuth = async () => {
      try {
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          // Em um app real, você buscaria os dados do usuário aqui
          setUser({ name: 'Usuário Teste', email: 'qualquer@email.com' });
        }
      } catch (e) {
        console.error("Falha ao checar autenticação", e);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setUser({ name: 'Usuário Teste', email });
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
export const useAuth = () => useContext(AuthContext);