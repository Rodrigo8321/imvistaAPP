import { API_CONFIG } from '../config/apiConfig';

class YahooFinanceService {
  constructor() {
    console.log('[Yahoo Finance] Service initialized');
  }

  /**
   * Converte símbolos brasileiros para o formato Yahoo Finance
   * Ex: PETR4 -> PETR4.SA, VALE3 -> VALE3.SA
   */
  formatSymbol(symbol) {
    const cleanSymbol = symbol.replace(/['"]/g, '').trim().toUpperCase();

    // Se já tem .SA, manter como está
    if (cleanSymbol.includes('.SA')) {
      return cleanSymbol;
    }

    // Para ações brasileiras (4-6 letras + número), adicionar .SA
    if (/^[A-Z]{4,6}\d?$/.test(cleanSymbol)) {
      return `${cleanSymbol}.SA`;
    }

    // Para ações internacionais, manter como está
    return cleanSymbol;
  }

  async getFundamentalData(symbol) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      console.log(`📊 [Yahoo Finance] Fetching fundamentals for ${symbol} (formatted: ${formattedSymbol})...`);

      // Yahoo Finance v7 API (pública, sem chave necessária)
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedSymbol}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
        console.warn(`[Yahoo Finance] No data for ${symbol}`);
        return null;
      }

      const quote = data.quoteResponse.result[0];

      // Yahoo Finance tem dados limitados, focamos no que conseguimos extrair
      const fundamentals = {
        priceEarnings: quote.trailingPE || null,
        pe: quote.trailingPE || null,
        priceToBook: quote.priceToBook || null,
        pvp: quote.priceToBook || null,
        pbValue: quote.priceToBook || null,

        dividendYield: quote.dividendYield || null, // Já vem em decimal
        dy: quote.dividendYield || null,

        marketCap: quote.marketCap || null,

        // Yahoo não fornece ROE diretamente, mas podemos estimar se temos EPS e bookValue
        roe: null, // Yahoo não fornece ROE diretamente
        returnOnEquity: null,

        // Outros dados disponíveis
        eps: quote.epsTrailingTwelveMonths || null,
        bookValue: quote.bookValue || null,

        sector: quote.sector || 'N/A',
        industry: quote.industry || 'N/A',

        source: 'Yahoo Finance',
        updatedAt: new Date().toISOString(),
      };

      console.log(`✅ [Yahoo Finance] Fundamentals loaded for ${symbol}:`, {
        pe: fundamentals.priceEarnings,
        dy: fundamentals.dividendYield,
        marketCap: fundamentals.marketCap
      });

      return fundamentals;

    } catch (error) {
      console.error(`❌ [Yahoo Finance] Error fetching fundamentals for ${symbol}:`, error);
      return null;
    }
  }

  async getQuote(symbol) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      console.log(`💰 [Yahoo Finance] Fetching quote for ${symbol} (formatted: ${formattedSymbol})...`);

      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${formattedSymbol}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Yahoo Finance quote API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
        console.warn(`[Yahoo Finance] No quote data for ${symbol}`);
        return null;
      }

      const quote = data.quoteResponse.result[0];

      return {
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        volume: quote.regularMarketVolume,
        marketCap: quote.marketCap,
        updatedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error(`❌ [Yahoo Finance] Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }
}

const yahooFinanceService = new YahooFinanceService();
export default yahooFinanceService;
