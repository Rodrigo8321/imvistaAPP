import AsyncStorage from '@react-native-async-storage/async-storage';

const WATCHLIST_KEY = '@InvestPro:watchlist';

export const watchlistService = {
  /**
   * Carrega toda a watchlist do AsyncStorage
   * @returns {Promise<string[]>} Array com tickers na watchlist
   */
  async getWatchlist() {
    try {
      const data = await AsyncStorage.getItem(WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao carregar watchlist:', error);
      return [];
    }
  },

  /**
   * Adiciona um ativo à watchlist
   * @param {string} ticker - Ticker do ativo (ex: "PETR4")
   * @returns {Promise<boolean>} true se adicionado com sucesso
   */
  async addToWatchlist(ticker) {
    try {
      const watchlist = await this.getWatchlist();

      // Verifica se já existe
      if (watchlist.includes(ticker)) {
        console.log(`${ticker} já está na watchlist`);
        return false;
      }

      // Adiciona e salva
      watchlist.push(ticker);
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));

      console.log(`✅ ${ticker} adicionado à watchlist`);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar à watchlist:', error);
      return false;
    }
  },

  /**
   * Remove um ativo da watchlist
   * @param {string} ticker - Ticker do ativo (ex: "PETR4")
   * @returns {Promise<boolean>} true se removido com sucesso
   */
  async removeFromWatchlist(ticker) {
    try {
      const watchlist = await this.getWatchlist();

      // Filtra o ativo removendo
      const updated = watchlist.filter(t => t !== ticker);

      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));

      console.log(`✅ ${ticker} removido da watchlist`);
      return true;
    } catch (error) {
      console.error('Erro ao remover da watchlist:', error);
      return false;
    }
  },

  /**
   * Verifica se um ativo está na watchlist
   * @param {string} ticker - Ticker do ativo
   * @returns {Promise<boolean>} true se está na watchlist
   */
  async isInWatchlist(ticker) {
    try {
      const watchlist = await this.getWatchlist();
      return watchlist.includes(ticker);
    } catch (error) {
      console.error('Erro ao verificar watchlist:', error);
      return false;
    }
  },

  /**
   * Alterna o status de um ativo na watchlist
   * Se estiver, remove. Se não estiver, adiciona.
   * @param {string} ticker - Ticker do ativo
   * @returns {Promise<boolean>} true se foi adicionado, false se foi removido
   */
  async toggleWatchlist(ticker) {
    try {
      const isInWatchlist = await this.isInWatchlist(ticker);

      if (isInWatchlist) {
        await this.removeFromWatchlist(ticker);
        return false; // Removido
      } else {
        await this.addToWatchlist(ticker);
        return true; // Adicionado
      }
    } catch (error) {
      console.error('Erro ao alternar watchlist:', error);
      return false;
    }
  },

  /**
   * Limpa toda a watchlist
   * @returns {Promise<boolean>} true se limpo com sucesso
   */
  async clearWatchlist() {
    try {
      await AsyncStorage.removeItem(WATCHLIST_KEY);
      console.log('✅ Watchlist limpa');
      return true;
    } catch (error) {
      console.error('Erro ao limpar watchlist:', error);
      return false;
    }
  },

  /**
   * Filtra ativos por tipo
   * @param {Array} portfolio - Array de ativos
   * @param {string} type - Tipo a filtrar ("Ação" ou "FII")
   * @param {Array} watchlist - Array de tickers na watchlist
   * @returns {Array} Ativos filtrados que estão na watchlist
   */
  filterByType(portfolio, type, watchlist) {
    return portfolio.filter(
      asset => asset.type === type && watchlist.includes(asset.ticker)
    );
  },

  /**
   * Retorna ativos da watchlist com dados completos
   * @param {Array} portfolio - Array de ativos (mock data)
   * @param {Array} watchlist - Array de tickers na watchlist
   * @returns {Array} Ativos completos que estão na watchlist
   */
  getWatchlistAssets(portfolio, watchlist) {
    return portfolio.filter(asset => watchlist.includes(asset.ticker));
  },
};
