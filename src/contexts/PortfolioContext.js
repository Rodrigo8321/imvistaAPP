import React, { createContext, useState, useContext, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import storageService from '../services/storageService'; // Manter para addAsset, se necessário
import { calculatePortfolioFromTransactions } from '../domain/transactions/transactionCalculator';

export const PortfolioContext = createContext();

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

export const PortfolioProvider = ({ children }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carrega o portfólio uma vez quando o app inicia
  useEffect(() => {
    loadPortfolio();
  }, []);



  const loadPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      // 1. Buscar todas as transações salvas
      const transactions = await transactionService.getTransactions();
      // 2. Calcular o estado do portfólio com base nessas transações
      const calculatedPortfolio = calculatePortfolioFromTransactions(transactions);
      setPortfolio(calculatedPortfolio);
      console.log('✅ Portfólio calculado a partir de', transactions.length, 'transações.');
    } catch (err) {
      console.error('❌ Erro ao carregar portfolio:', err);
      setError('Erro ao carregar portfolio');
    } finally {
      setLoading(false);
    }
  };

  const savePortfolio = async (newPortfolio) => {
    try {
      setError(null);
      // Esta função se torna obsoleta, pois o portfólio é sempre calculado.
      // A persistência agora é feita no nível da transação.
      console.warn('savePortfolio não é mais necessário. O portfólio é calculado dinamicamente.');
      setPortfolio(newPortfolio);
      return Promise.resolve(true);
    } catch (err) {
      console.error('❌ Erro ao salvar portfolio:', err);
      setError('Erro ao salvar portfolio');
      return false;
    }
  };

  const addAsset = async (assetData) => {
    try {
      setError(null);
      const success = await transactionService.addTransaction({
        ...assetData,
        type: 'Compra',
        typeAsset: assetData.type, // Garante que o tipo do ativo seja passado para a transação
      });
      if (success) {
        await loadPortfolio(); // Recalcula o portfólio para incluir o novo ativo
      }
      return success;
    } catch (err) {
      console.error('❌ Erro ao adicionar ativo:', err);
      setError('Erro ao adicionar ativo');
      throw err;
    }
  };

  const updateAsset = async (assetId, updates) => {
    try {
      setError(null);
      // A atualização de um ativo (ex: preço médio, quantidade) é feita
      // registrando novas transações (compra/venda), não editando o ativo diretamente.
      console.warn('updateAsset não é mais suportado. Registre uma nova transação.');
      return null;
    } catch (err) {
      console.error('❌ Erro ao atualizar ativo:', err);
      setError('Erro ao atualizar ativo');
      throw err;
    }
  };

  const removeAsset = async (assetId) => {
    try {
      setError(null);
      // Remover um ativo significa remover todas as suas transações.
      // Esta é uma operação destrutiva e deve ser implementada com cuidado.
      // Por ora, vamos apenas avisar.
      console.warn(`Remover ativo ${assetId} requer a remoção de todas as suas transações.`);
      return true;
    } catch (err) {
      console.error('❌ Erro ao remover ativo:', err);
      setError('Erro ao remover ativo');
      throw err;
    }
  };

  const getAssetById = (assetId) => {
    return portfolio.find(asset => asset.id === assetId);
  };

  const getAssetsByCountry = (country) => {
    if (country === 'all') return portfolio;
    return portfolio.filter(asset => asset.country === country);
  };

  const getAssetsByType = (type) => {
    if (type === 'all') return portfolio;
    return portfolio.filter(asset => asset.type === type);
  };

  const getPortfolioStats = () => {
    const totalAssets = portfolio.length;
    const totalInvested = portfolio.reduce((sum, asset) => sum + (asset.averagePrice * asset.quantity), 0);
    const totalCurrent = portfolio.reduce((sum, asset) => sum + (asset.currentPrice * asset.quantity), 0);
    const totalProfit = totalCurrent - totalInvested;
    const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const byCountry = portfolio.reduce((acc, asset) => {
      acc[asset.country] = (acc[asset.country] || 0) + 1;
      return acc;
    }, {});

    const byType = portfolio.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAssets,
      totalInvested,
      totalCurrent,
      totalProfit,
      profitPercent,
      byCountry,
      byType,
    };
  };

  /* ------------------- PRIVACY MODE ------------------- */
  const [isPrivacyModeEnabled, setIsPrivacyModeEnabled] = useState(false);

  const togglePrivacyMode = () => {
    setIsPrivacyModeEnabled(prev => !prev);
  };

  const clearPortfolio = async () => {
    try {
      setError(null);
      await storageService.clearAllData();
      setPortfolio([]);
      console.log('🧹 Portfolio limpo');
      return true;
    } catch (err) {
      console.error('❌ Erro ao limpar portfolio:', err);
      setError('Erro ao limpar portfolio');
      return false;
    }
  };

  const value = {
    // Estado
    portfolio,
    loading,
    error,
    isPrivacyModeEnabled,

    // Ações
    loadPortfolio,
    savePortfolio,
    addAsset,
    reloadPortfolio: loadPortfolio, // Adiciona o alias para a função
    updateAsset,
    removeAsset,
    togglePrivacyMode,

    // Getters
    getAssetById,
    getAssetsByCountry,
    getAssetsByType,
    getPortfolioStats,

    // Utilitários
    clearPortfolio,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
