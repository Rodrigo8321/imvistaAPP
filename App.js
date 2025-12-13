import React, { useEffect } from 'react';
import { StatusBar, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/contexts/AuthContext';
import { PortfolioProvider } from './src/contexts/PortfolioContext';
import RootNavigator from './src/navigation/RootNavigator';

// ✅ ADICIONADO - Importar variáveis de ambiente
import { 
  BRAPI_API_KEY,
  ALPHA_VANTAGE_API_KEY, 
  COINGECKO_API_KEY 
} from '@env';

export default function App() {
  // ✅ ADICIONADO - Validação de variáveis de ambiente
  useEffect(() => {
    console.log('\n========== DEBUG VARIÁVEIS DE AMBIENTE ==========');
    console.log('BRAPI_API_KEY:', BRAPI_API_KEY ? `✓ (últimos 4: ${BRAPI_API_KEY.slice(-4)})` : '❌ UNDEFINED');
    console.log('ALPHA_VANTAGE_API_KEY:', ALPHA_VANTAGE_API_KEY ? '✓' : '❌ UNDEFINED');
    console.log('COINGECKO_API_KEY:', COINGECKO_API_KEY ? '✓' : '❌ UNDEFINED');
    console.log('==================================================\n');
    
    // Verificar se alguma chave está faltando
    const missingKeys = [];
    if (!BRAPI_API_KEY) missingKeys.push('BRAPI_API_KEY');
    if (!ALPHA_VANTAGE_API_KEY) missingKeys.push('ALPHA_VANTAGE_API_KEY');
    if (!COINGECKO_API_KEY) missingKeys.push('COINGECKO_API_KEY');
    
    if (missingKeys.length > 0) {
      console.error('❌ Variáveis de ambiente faltando:', missingKeys.join(', '));
      Alert.alert(
        '⚠️ Erro de Configuração',
        `Variáveis não encontradas no .env:\n\n${missingKeys.join('\n')}\n\nO app pode não funcionar corretamente.`,
        [{ text: 'OK' }]
      );
    } else {
      console.log('✅ Todas as variáveis de ambiente carregadas com sucesso!');
    }
  }, []);

  return (
    <AuthProvider>
      <PortfolioProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </PortfolioProvider>
    </AuthProvider>
  );
}