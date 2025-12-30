import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import colors from '../../styles/colors';
import {
  clearCache,
  testQuotesApi,
  testExchangeRateApi,
} from '../../services/marketService';
import { transactionService } from '../../services/transactionService';
import storageService from '../../services/storageService';

const SettingsScreen = ({ navigation }) => {
  const { logout, user } = useAuth();
  const [apiStatus, setApiStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleResetAll = () => {
    Alert.alert(
      '🚨 Redefinição Total',
      'Isso apagará ABSOLUTAMENTE TUDO: seu portfólio, histórico de transações e preferências. O app voltará ao estado original. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'APAGAR TUDO',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              await transactionService.clearTransactions();
              Alert.alert('Sucesso', 'Todos os dados foram removidos. Por favor, reinicie o aplicativo para aplicar as mudanças.');
            } catch (error) {
              Alert.alert('Erro', 'Ocorreu um erro ao tentar limpar os dados.');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // Navegação automática via RootNavigator
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpar Cache de Cotações',
      'Isso forçará a busca por novas cotações na próxima atualização. Deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              Alert.alert('Sucesso', 'O cache de cotações foi limpo.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar o cache.');
            }
          },
        },
      ]
    );
  };

  const handleClearTransactions = () => {
    Alert.alert(
      '⚠️ Limpar Todas as Transações',
      'Esta ação é irreversível e irá apagar todo o seu histórico de transações e portfólio. Deseja continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Limpar Tudo',
          style: 'destructive',
          onPress: async () => {
            try {
              await transactionService.clearTransactions();
              Alert.alert('Sucesso', 'Todas as suas transações foram apagadas. O aplicativo será recarregado.');
              // Idealmente, forçar um recarregamento do app ou do contexto aqui.
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível limpar as transações.');
            }
          },
        },
      ]
    );
  };

  const handleCheckApiStatus = async () => {
    setIsTesting(true);
    setApiStatus(null);
    try {
      const quotesResult = await testQuotesApi();
      const exchangeResult = await testExchangeRateApi();
      setApiStatus({ quotes: quotesResult, exchange: exchangeResult });
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado ao testar as APIs.');
    }
    setIsTesting(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚙️ Configurações</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Info do Usuário */}
        <View style={styles.userCard}>
          <View style={styles.userIcon}>
            <Text style={styles.userIconText}>👤</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        {/* Opções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionIcon}>👤</Text>
            <Text style={styles.optionText}>Editar Perfil</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionIcon}>🔔</Text>
            <Text style={styles.optionText}>Notificações</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('Goals')}>
            <Text style={styles.optionIcon}>🎯</Text>
            <Text style={styles.optionText}>Minhas Metas</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionIcon}>🔒</Text>
            <Text style={styles.optionText}>Privacidade</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Aplicativo</Text>

          <TouchableOpacity style={styles.optionButton} onPress={handleClearCache}>
            <Text style={styles.optionIcon}>🗑️</Text>
            <Text style={styles.optionText}>Limpar Cache de Cotações</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, { borderColor: colors.danger }]} onPress={handleClearTransactions}>
            <Text style={styles.optionIcon}>🔥</Text>
            <Text style={[styles.optionText, { color: colors.danger }]}>Limpar Todas as Transações</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.optionButton, { borderColor: colors.danger, backgroundColor: colors.danger + '10' }]} onPress={handleResetAll}>
            <Text style={styles.optionIcon}>🚨</Text>
            <Text style={[styles.optionText, { color: colors.danger, fontWeight: 'bold' }]}>Redefinir Aplicativo (Instalação Limpa)</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Status do Sistema */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status do Sistema</Text>

          <TouchableOpacity style={styles.optionButton} onPress={handleCheckApiStatus} disabled={isTesting}>
            <Text style={styles.optionIcon}>📡</Text>
            <Text style={styles.optionText}>{isTesting ? 'Verificando...' : 'Verificar Conexão das APIs'}</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          {apiStatus && (
            <View style={styles.statusContainer}>
              {/* Status API de Cotações */}
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>API de Cotações</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusIndicator}>
                    {apiStatus.quotes.success ? '🟢' : '🔴'}
                  </Text>
                  <Text style={styles.statusLabel}>
                    {apiStatus.quotes.success ? 'Operacional' : 'Falha'}
                  </Text>
                </View>
              </View>
              {/* Status API de Câmbio */}
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>API de Câmbio (USD-BRL)</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusIndicator}>
                    {apiStatus.exchange.success ? '🟢' : '🔴'}
                  </Text>
                  <Text style={styles.statusLabel}>
                    {apiStatus.exchange.success ? 'Operacional' : 'Falha'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>

          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionIcon}>ℹ️</Text>
            <Text style={styles.optionText}>Sobre o App</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton}>
            <Text style={styles.optionIcon}>📄</Text>
            <Text style={styles.optionText}>Termos de Uso</Text>
            <Text style={styles.optionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userIconText: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  optionButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  optionArrow: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    fontSize: 14,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButton: {
    backgroundColor: colors.danger + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.danger,
  },
});

export default SettingsScreen;
