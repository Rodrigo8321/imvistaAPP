/**
 * Serviço para gerenciamento da watchlist (lista de favoritos)
 * Responsável por armazenar e recuperar ativos favoritados pelo usuário
 */

class WatchlistService {
  constructor() {
    this.watchlist = [];
    this.listeners = [];
  }

  /**
   * Adiciona um ativo à watchlist
   * @param {object} asset - Ativo a ser adicionado
   * @returns {boolean} - True se adicionado com sucesso, false se já existe
   */
  addToWatchlist(asset) {
    const exists = this.watchlist.find(item => item.id === asset.id);
    if (!exists) {
      this.watchlist.push(asset);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Remove um ativo da watchlist
   * @param {string} assetId - ID do ativo a ser removido
   * @returns {boolean} - True se removido com sucesso, false se não encontrado
   */
  removeFromWatchlist(assetId) {
    const index = this.watchlist.findIndex(item => item.id === assetId);
    if (index !== -1) {
      this.watchlist.splice(index, 1);
      this.notifyListeners();
      return true;
    }
    return false;
  }

  /**
   * Verifica se um ativo está na watchlist
   * @param {string} assetId - ID do ativo
   * @returns {boolean} - True se está na watchlist
   */
  isInWatchlist(assetId) {
    return this.watchlist.some(item => item.id === assetId);
  }

  /**
   * Retorna todos os ativos da watchlist
   * @returns {Array} - Lista de ativos favoritados
   */
  getWatchlist() {
    return [...this.watchlist];
  }

  /**
   * Limpa toda a watchlist
   */
  clearWatchlist() {
    this.watchlist = [];
    this.notifyListeners();
  }

  /**
   * Adiciona um listener para mudanças na watchlist
   * @param {function} listener - Função callback
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove um listener
   * @param {function} listener - Função callback a ser removida
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notifica todos os listeners sobre mudanças
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getWatchlist());
      } catch (error) {
        console.error('Erro ao notificar listener da watchlist:', error);
      }
    });
  }

  /**
   * Filtra watchlist por tipo
   * @param {string} type - Tipo de ativo ('Ação', 'FII', etc.)
   * @returns {Array} - Lista filtrada
   */
  getWatchlistByType(type) {
    return this.watchlist.filter(asset => asset.type === type);
  }

  /**
   * Busca ativos na watchlist por termo
   * @param {string} query - Termo de busca
   * @returns {Array} - Lista filtrada
   */
  searchWatchlist(query) {
    const lowerQuery = query.toLowerCase();
    return this.watchlist.filter(asset =>
      asset.ticker.toLowerCase().includes(lowerQuery) ||
      asset.name.toLowerCase().includes(lowerQuery) ||
      asset.sector.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Retorna estatísticas da watchlist
   * @returns {object} - Estatísticas
   */
  getWatchlistStats() {
    const totalAssets = this.watchlist.length;
    const byType = this.watchlist.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalAssets,
      byType,
    };
  }
}

// Instância singleton do serviço
export const watchlistService = new WatchlistService();
