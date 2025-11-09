import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = '@InvestPro:transactions';

export const transactionService = {
  /**
   * Carrega todas as transações do AsyncStorage
   * @returns {Promise<Array>} Array com todas as transações
   */
  async getTransactions() {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      return [];
    }
  },

  /**
   * Adiciona uma nova transação
   * @param {Object} transaction - Dados da transação
   * @returns {Promise<boolean>} true se adicionado com sucesso
   */
  async addTransaction(transaction) {
    try {
      const transactions = await this.getTransactions();

      // Gera ID único
      const newTransaction = {
        id: Date.now().toString(),
        ...transaction,
        date: transaction.date || new Date().toISOString(),
      };

      transactions.push(newTransaction);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

      console.log(`✅ Transação adicionada: ${newTransaction.ticker}`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      return false;
    }
  },

  /**
   * Deleta uma transação
   * @param {string} transactionId - ID da transação
   * @returns {Promise<boolean>} true se deletado com sucesso
   */
  async deleteTransaction(transactionId) {
    try {
      const transactions = await this.getTransactions();
      const filtered = transactions.filter(t => t.id !== transactionId);

      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
      console.log(`✅ Transação deletada`);
      return true;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return false;
    }
  },

  /**
   * Filtra transações por tipo
   * @param {Array} transactions - Array de transações
   * @param {string} type - Tipo ("Compra" ou "Venda")
   * @returns {Array} Transações filtradas
   */
  filterByType(transactions, type) {
    if (type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
  },

  /**
   * Filtra transações por período
   * @param {Array} transactions - Array de transações
   * @param {string} period - Período ("mes", "trimestre", "ano" ou "todos")
   * @returns {Array} Transações filtradas
   */
  filterByPeriod(transactions, period) {
    if (period === 'todos') return transactions;

    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case 'mes':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'trimestre':
        startDate.setDate(now.getDate() - 90);
        break;
      case 'ano':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return transactions;
    }

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate;
    });
  },

  /**
   * Calcula totais de transações
   * @param {Array} transactions - Array de transações
   * @returns {Object} Objeto com totais
   */
  calculateTotals(transactions) {
    let totalBought = 0;
    let totalSold = 0;
    let totalProfit = 0;

    transactions.forEach(transaction => {
      const total = transaction.quantity * transaction.unitPrice;

      if (transaction.type === 'Compra') {
        totalBought += total;
      } else if (transaction.type === 'Venda') {
        totalSold += total;
        totalProfit += transaction.profit || 0;
      }
    });

    const profitPercent = totalBought > 0 ? (totalProfit / totalBought) * 100 : 0;

    return {
      totalBought,
      totalSold,
      totalProfit,
      profitPercent,
    };
  },

  /**
   * Retorna estatísticas por ativo
   * @param {Array} transactions - Array de transações
   * @returns {Object} Objeto com stats por ativo
   */
  getStatsByAsset(transactions) {
    const stats = {};

    transactions.forEach(transaction => {
      if (!stats[transaction.ticker]) {
        stats[transaction.ticker] = {
          ticker: transaction.ticker,
          name: transaction.name,
          totalBought: 0,
          quantityOwned: 0,
          avgPrice: 0,
          totalInvested: 0,
          totalProfit: 0,
        };
      }

      const stat = stats[transaction.ticker];

      if (transaction.type === 'Compra') {
        stat.quantityOwned += transaction.quantity;
        stat.totalInvested += transaction.quantity * transaction.unitPrice;
      } else if (transaction.type === 'Venda') {
        stat.quantityOwned -= transaction.quantity;
        stat.totalProfit += transaction.profit || 0;
      }

      // Calcular preço médio
      if (stat.quantityOwned > 0) {
        stat.avgPrice = stat.totalInvested / stat.quantityOwned;
      }
    });

    return stats;
  },

  /**
   * Busca transações por ticker
   * @param {Array} transactions - Array de transações
   * @param {string} ticker - Ticker do ativo
   * @returns {Array} Transações do ativo
   */
  searchByTicker(transactions, ticker) {
    return transactions.filter(t =>
      t.ticker.toLowerCase().includes(ticker.toLowerCase())
    );
  },

  /**
   * Ordena transações por data (mais recentes primeiro)
   * @param {Array} transactions - Array de transações
   * @returns {Array} Transações ordenadas
   */
  sortByDate(transactions) {
    return [...transactions].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  },

  /**
   * Limpa todas as transações
   * @returns {Promise<boolean>} true se limpo com sucesso
   */
  async clearTransactions() {
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
      console.log('✅ Transações limpas');
      return true;
    } catch (error) {
      console.error('Erro ao limpar transações:', error);
      return false;
    }
  },
};
