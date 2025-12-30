import { FMP_API_KEY } from '@env';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

class FmpService {
  constructor() {
    this.apiKey = FMP_API_KEY;
  }

  /**
   * Busca métricas fundamentais (TTM) para um ticker.
   * Para ativos brasileiros, adiciona automaticamente o sufixo .SA if needed.
   */
  async getFundamentalMetrics(ticker) {
    if (!this.apiKey) return null;

    try {
      // Ajusta ticker para o padrão FMP (ex: BBSE3 -> BBSE3.SA)
      let fmpTicker = ticker.toUpperCase();
      if (!fmpTicker.includes('.') && fmpTicker.length <= 6) {
        fmpTicker = `${fmpTicker}.SA`;
      }

      console.log(`🌐 Fetching FMP Fallback for ${fmpTicker}...`);

      // Buscamos ratios e key-metrics para ter uma visão completa
      const [ratiosRes, metricsRes] = await Promise.all([
        fetch(`${FMP_BASE_URL}/ratios-ttm/${fmpTicker}?apikey=${this.apiKey}`),
        fetch(`${FMP_BASE_URL}/key-metrics-ttm/${fmpTicker}?apikey=${this.apiKey}`)
      ]);

      const ratiosData = await ratiosRes.json();
      const metricsData = await metricsRes.json();

      console.log(`[DEBUG] FMP Raw for ${fmpTicker}: RatiosFound=${!!(ratiosData && ratiosData.length)}, MetricsFound=${!!(metricsData && metricsData.length)}`);

      if ((!ratiosData || ratiosData.length === 0) && (!metricsData || metricsData.length === 0)) {
        console.warn(`⚠️ FMP: Nenhum dado encontrado para ${fmpTicker}`);
        return null;
      }

      const ratios = ratiosData[0] || {};
      const metrics = metricsData[0] || {};

      return {
        priceEarnings: ratios.peRatioTTM || null,
        priceToBook: ratios.priceToBookValueRatioTTM || null,
        priceToSales: ratios.priceToSalesRatioTTM || null,
        evToEbitda: ratios.enterpriseValueOverEBITDATTM || null,
        roe: ratios.returnOnEquityTTM ? ratios.returnOnEquityTTM * 100 : null,
        roa: ratios.returnOnAssetsTTM ? ratios.returnOnAssetsTTM * 100 : null,
        netMargin: ratios.netProfitMarginTTM ? ratios.netProfitMarginTTM * 100 : null,
        dividendYield: ratios.dividendYieldTTM ? ratios.dividendYieldTTM * 100 : (ratios.dividendYieldPercentageTTM || null),
        debtToEquity: ratios.debtEquityRatioTTM || null,
        revenueGrowth: metrics.revenueGrowthTTM ? metrics.revenueGrowthTTM * 100 : null,
        source: 'FMP'
      };
    } catch (error) {
      console.warn(`❌ FMP Error for ${ticker}:`, error.message);
      return null;
    }
  }
}

const fmpService = new FmpService();
export default fmpService;
