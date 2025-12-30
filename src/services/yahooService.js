/**
 * Yahoo Finance Service - Simplified v7
 * 
 * Este serviço utiliza o endpoint v7 do Yahoo Finance, que é mais estável
 * e menos propenso a bloqueios 401/403.
 */

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v7/finance/quote';

class YahooService {
  async getFundamentalData(ticker) {
    let symbol = ticker.toUpperCase();
    if (!symbol.includes('.') && symbol.length <= 6) {
      symbol = `${symbol}.SA`;
    }

    try {
      console.log(`📊 [Yahoo] Fetching v7 for ${symbol}...`);
      const url = `${YAHOO_BASE_URL}?symbols=${symbol}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const json = await response.json();
      if (!json.quoteResponse || !json.quoteResponse.result || json.quoteResponse.result.length === 0) {
        return null;
      }

      const res = json.quoteResponse.result[0];

      return {
        priceEarnings: res.trailingPE || res.forwardPE || null,
        priceToBook: res.priceToBook || null,
        dividendYield: (res.trailingAnnualDividendYield || res.dividendYield) ? (res.trailingAnnualDividendYield || res.dividendYield) * 100 : null,
        roe: res.returnOnEquity ? res.returnOnEquity * 100 : null,
        netMargin: res.profitMargins ? res.profitMargins * 100 : null,
        ebitdaMargin: res.ebitdaMargins ? res.ebitdaMargins * 100 : null,
        marketCap: res.marketCap || null,
        source: 'Yahoo Finance (v7)'
      };
    } catch (error) {
      console.warn(`❌ [Yahoo] v7 Error for ${symbol}:`, error.message);
      return null;
    }
  }
}

const yahooService = new YahooService();
export default yahooService;
