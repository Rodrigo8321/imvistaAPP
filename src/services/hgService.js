import { HG_BRASIL_API_KEY } from '@env';

const HG_BASE_URL = 'https://api.hgbrasil.com/finance/stock_price';

class HgService {
  /**
   * Busca dados fundamentais de uma ação na B3.
   * @param {string} ticker - Ex: BBSE3
   */
  async getFundamentalData(ticker) {
    // Se não houver chave, falha silenciosamente para o próximo fallback
    if (!HG_BRASIL_API_KEY) return null;

    try {
      const cleanTicker = ticker.replace(/['"]/g, '').trim().toUpperCase();
      console.log(`🇧🇷 [HG Brasil] Fetching fundamentals for ${cleanTicker}...`);

      const url = `${HG_BASE_URL}?key=${HG_BRASIL_API_KEY}&symbol=${cleanTicker}`;
      const response = await fetch(url);
      const json = await response.json();

      if (!json.results || !json.results[cleanTicker]) {
        console.warn(`⚠️ [HG] No results for ${cleanTicker}`);
        return null;
      }

      const data = json.results[cleanTicker];

      // Mapeamento HG -> Formato Interno
      return {
        priceEarnings: data.price_earnings || null,
        priceToBook: data.price_book_value || null,
        dividendYield: data.dividend_yield || null,
        roe: data.return_on_equity || null,
        netMargin: data.net_margin || null,
        marketCap: data.market_cap || null,
        source: 'HG Brasil'
      };
    } catch (error) {
      console.warn(`❌ [HG] Error for ${ticker}:`, error.message);
      return null;
    }
  }
}

const hgService = new HgService();
export default hgService;
