import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSACTIONS_KEY = '@InvestPro:transactions';
const CLEANUP_FLAG_KEY = '@InvestPro:transactionsCleaned';

export const transactionService = {
  /**
   * Carrega todas as transações do AsyncStorage
   * @returns {Promise<Array>} Array com todas as transações
   */
  async getTransactions() {
    try {
      const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      const transactions = data ? JSON.parse(data) : [];

      // Sanitização em tempo de leitura para corrigir dados antigos "sujos"
      return transactions.map(tx => ({
        ...tx,
        ticker: (tx.ticker || '').replace(/['"]/g, '').trim().toUpperCase()
      }));
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
      if (!transaction) {
        console.error('Transaction is undefined');
        return false;
      }
      const transactions = await this.getTransactions();

      // Limpa o ticker: remove aspas, espaços e converte para maiúsculo
      const cleanTicker = (transaction.ticker || '').replace(/['"]/g, '').trim().toUpperCase();

      // Gera ID único
      const newTransaction = {
        id: Date.now().toString(),
        ...transaction,
        ticker: cleanTicker,
        date: transaction.date || new Date().toISOString(),
      };

      transactions.push(newTransaction);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));

      console.log(`✅ Transação adicionada e limpa: ${newTransaction.ticker}`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      return false;
    }
  },

  /**
   * Salva um array de transações, substituindo as existentes.
   * @param {Array} transactions - O array de transações a ser salvo.
   * @returns {Promise<boolean>} true se salvo com sucesso.
   */
  async saveTransactions(transactions) {
    try {
      await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
      console.log(`💾 ${transactions.length} transações salvas.`);
      return true;
    } catch (error) {
      console.error('Erro ao salvar transações:', error);
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
    if (type === 'all' || type === 'todos') return transactions;
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

  /**
   * Marca que a limpeza inicial de transações foi concluída.
   */
  async markAsCleaned() {
    try {
      await AsyncStorage.setItem(CLEANUP_FLAG_KEY, 'true');
    } catch (error) {
      console.error('Erro ao marcar flag de limpeza:', error);
    }
  },

  /**
   * Verifica se a limpeza inicial já foi executada.
   */
  async hasBeenCleaned() {
    try {
      return (await AsyncStorage.getItem(CLEANUP_FLAG_KEY)) === 'true';
    } catch (error) {
      return false;
    }
  },
};
