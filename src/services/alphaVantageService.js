/**
 * Alpha Vantage Service - Para dados de ações brasileiras e internacionais
 *
 * Este serviço utiliza a API do Alpha Vantage para obter dados fundamentais
 * de ações brasileiras (B3) e internacionais, incluindo ROE e outros indicadores.
 */

import { API_CONFIG } from '../config/apiConfig';

const ALPHA_VANTAGE_BASE_URL = API_CONFIG.alphaVantage.baseUrl;

class AlphaVantageService {
  constructor() {
    this.apiKey = API_CONFIG.alphaVantage.apiKey;
    console.log('[Alpha Vantage] Service initialized');
  }

  /**
   * Converte símbolos brasileiros para o formato Alpha Vantage
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
      console.log(`📊 [Alpha Vantage] Fetching fundamentals for ${symbol} (formatted: ${formattedSymbol})...`);

      // 1. Obter dados da empresa (OVERVIEW)
      const overviewUrl = `${ALPHA_VANTAGE_BASE_URL}?function=OVERVIEW&symbol=${formattedSymbol}&apikey=${this.apiKey}`;
      const overviewResponse = await fetch(overviewUrl);

      if (!overviewResponse.ok) {
        throw new Error(`Overview API error: ${overviewResponse.status}`);
      }

      const overviewData = await overviewResponse.json();

      // Verificar se há dados válidos
      if (!overviewData || overviewData['Error Message'] || overviewData['Note']) {
        console.warn(`[Alpha Vantage] No overview data for ${symbol}`);
        return null;
      }

      // 2. Obter dados de balanço (BALANCE_SHEET - último trimestre)
      const balanceSheetUrl = `${ALPHA_VANTAGE_BASE_URL}?function=BALANCE_SHEET&symbol=${formattedSymbol}&apikey=${this.apiKey}`;
      const balanceResponse = await fetch(balanceSheetUrl);

      let balanceData = null;
      if (balanceResponse.ok) {
        const balanceJson = await balanceResponse.json();
        if (balanceJson.annualReports && balanceJson.annualReports.length > 0) {
          balanceData = balanceJson.annualReports[0];
        }
      }

      // 3. Obter dados de income statement
      const incomeUrl = `${ALPHA_VANTAGE_BASE_URL}?function=INCOME_STATEMENT&symbol=${formattedSymbol}&apikey=${this.apiKey}`;
      const incomeResponse = await fetch(incomeUrl);

      let incomeData = null;
      if (incomeResponse.ok) {
        const incomeJson = await incomeResponse.json();
        if (incomeJson.annualReports && incomeJson.annualReports.length > 0) {
          incomeData = incomeJson.annualReports[0];
        }
      }

      // Calcular ROE se temos os dados necessários
      let roe = null;
      if (balanceData && incomeData) {
        const totalEquity = parseFloat(balanceData.totalShareholderEquity);
        const netIncome = parseFloat(incomeData.netIncome);

        if (totalEquity && netIncome && totalEquity > 0) {
          roe = (netIncome / totalEquity) * 100; // Em porcentagem
          console.log(`[Alpha Vantage] Calculated ROE for ${symbol}: ${roe.toFixed(2)}% (NetIncome: ${netIncome}, Equity: ${totalEquity})`);
        } else {
          console.log(`[Alpha Vantage] Cannot calculate ROE for ${symbol}: NetIncome=${netIncome}, Equity=${totalEquity}`);
        }
      } else {
        console.log(`[Alpha Vantage] Missing balance or income data for ${symbol} ROE calculation`);
      }

      // Mapear dados para o formato esperado
      const fundamentals = {
        priceEarnings: overviewData.PERatio ? parseFloat(overviewData.PERatio) : null,
        pe: overviewData.PERatio ? parseFloat(overviewData.PERatio) : null,
        priceToBook: overviewData.PriceToBookRatio ? parseFloat(overviewData.PriceToBookRatio) : null,
        pvp: overviewData.PriceToBookRatio ? parseFloat(overviewData.PriceToBookRatio) : null,
        pbValue: overviewData.PriceToBookRatio ? parseFloat(overviewData.PriceToBookRatio) : null,

        dividendYield: overviewData.DividendYield ? parseFloat(overviewData.DividendYield) * 100 : null, // Converter para %
        dy: overviewData.DividendYield ? parseFloat(overviewData.DividendYield) * 100 : null,

        roe: roe, // ROE calculado em %
        returnOnEquity: roe,

        marketCap: overviewData.MarketCapitalization ? parseFloat(overviewData.MarketCapitalization) : null,

        sector: overviewData.Sector || 'N/A',
        industry: overviewData.Industry || 'N/A',

        source: 'Alpha Vantage',
        updatedAt: new Date().toISOString(),
      };

      console.log(`✅ [Alpha Vantage] Fundamentals loaded for ${symbol}:`, {
        pe: fundamentals.priceEarnings,
        roe: fundamentals.returnOnEquity,
        dy: fundamentals.dividendYield,
        sector: fundamentals.sector
      });

      return fundamentals;

    } catch (error) {
      console.error(`❌ [Alpha Vantage] Error fetching fundamentals for ${symbol}:`, error);
      return null;
    }
  }

  async getQuote(symbol) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      console.log(`💰 [Alpha Vantage] Fetching quote for ${symbol} (formatted: ${formattedSymbol})...`);

      const url = `${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=${formattedSymbol}&apikey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Quote API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data['Global Quote']) {
        console.warn(`[Alpha Vantage] No quote data for ${symbol}`);
        return null;
      }

      const quote = data['Global Quote'];

      return {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        updatedAt: new Date().toISOString(),
      };

    } catch (error) {
      console.error(`❌ [Alpha Vantage] Error fetching quote for ${symbol}:`, error);
      return null;
    }
  }

  async getNewsSentiment(symbol, limit = 10) {
    try {
      const formattedSymbol = this.formatSymbol(symbol);
      console.log(`📰 [Alpha Vantage] Fetching news sentiment for ${symbol} (formatted: ${formattedSymbol})...`);

      const url = `${ALPHA_VANTAGE_BASE_URL}?function=NEWS_SENTIMENT&tickers=${formattedSymbol}&limit=${limit}&apikey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`News Sentiment API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.feed || data.feed.length === 0) {
        console.warn(`[Alpha Vantage] No news sentiment data for ${symbol}`);
        return [];
      }

      // Mapear dados para o formato esperado pelo app
      const news = data.feed.map(item => ({
        title: item.title,
        source: item.source,
        publishedAt: item.time_published,
        url: item.url,
        summary: item.summary,
        sentiment: {
          overall: item.overall_sentiment_score,
          label: item.overall_sentiment_label
        },
        tickers: item.ticker_sentiment?.map(t => ({
          ticker: t.ticker,
          relevance: t.relevance_score,
          sentiment: t.ticker_sentiment_score,
          label: t.ticker_sentiment_label
        })) || []
      }));

      console.log(`✅ [Alpha Vantage] News sentiment loaded for ${symbol}: ${news.length} articles`);

      return news;

    } catch (error) {
      console.error(`❌ [Alpha Vantage] Error fetching news sentiment for ${symbol}:`, error);
      return [];
    }
  }
}

const alphaVantageService = new AlphaVantageService();
export default alphaVantageService;
