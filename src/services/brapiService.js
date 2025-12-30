import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAPI_API_KEY } from '@env';
import fmpService from './fmpService';
import yahooService from './yahooService';
import yahooFinanceService from './yahooFinanceService';
import hgService from './hgService';
import fundamentusService from './fundamentusService';
import alphaVantageService from './alphaVantageService';

const BRAPI_BASE_URL = 'https://brapi.dev/api';
const FUNDAMENTALS_CACHE_KEY = 'fundamentals_v10_'; // Incrementado para invalidar cache antigo e forçar busca nova
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 horas

class BrapiService {
  constructor() {
    this.apiKey = BRAPI_API_KEY;
    console.log('[DEBUG] Initializing Brapi Service...');
  }

  async getFromCache(symbol) {
    try {
      const cached = await AsyncStorage.getItem(FUNDAMENTALS_CACHE_KEY + symbol);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        if (age < CACHE_TTL) {
          console.log(`✅ Fundamentals Cache HIT for ${symbol}`);
          return data;
        }
      }
    } catch (e) {
      console.warn('Cache error:', e);
    }
    return null;
  }

  async saveToCache(symbol, data) {
    try {
      const cacheData = { data, timestamp: Date.now() };
      await AsyncStorage.setItem(FUNDAMENTALS_CACHE_KEY + symbol, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Cache save error:', e);
    }
  }

  async getTrendSnapshot(symbol) {
    try {
      const snapshot = await AsyncStorage.getItem('snapshot_' + symbol);
      return snapshot ? JSON.parse(snapshot) : null;
    } catch (e) {
      return null;
    }
  }

  async saveTrendSnapshot(symbol, data) {
    try {
      // Salva apenas os indicadores principais para comparação
      const snapshot = {
        pe: data.pe,
        roe: data.roe,
        dividendYield: data.dividendYield,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem('snapshot_' + symbol, JSON.stringify(snapshot));
    } catch (e) { }
  }

  async getQuote(symbol) {
    try {
      const cleanSymbol = symbol.replace(/['"]/g, '').trim().toUpperCase();
      console.log(`🇧🇷 Fetching Brapi Quote: ${cleanSymbol}...`);
      const url = `${BRAPI_BASE_URL}/quote/${cleanSymbol}?token=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok || !data.results || data.results.length === 0) {
        throw new Error(`404 Não encontramos a ação ${cleanSymbol}`);
      }

      const result = data.results[0];
      return {
        price: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose,
        open: result.regularMarketOpen,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        volume: result.regularMarketVolume,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        marketCap: result.marketCap,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`⚠️ Error fetching ${symbol}: ${error.message}`);
      throw error;
    }
  }

  async getFundamentals(symbol) {
    const cleanSymbol = symbol.replace(/['"]/g, '').trim().toUpperCase();

    // Tentar Cache primeiro
    const cachedData = await this.getFromCache(cleanSymbol);
    if (cachedData) {
      console.log(`📊 Fundamentals CACHE HIT for ${cleanSymbol}:`, {
        pe: cachedData.priceEarnings,
        roe: cachedData.returnOnEquity,
        dy: cachedData.dividendYield,
        pvp: cachedData.priceToBook,
        lpa: cachedData.lpa,
        profitMargin: cachedData.profitMargin,
        debtToEbitda: cachedData.debtToEbitda
      });

      // ✅ VERIFICAÇÃO CRÍTICA: Se dados essenciais estão faltando, forçar nova busca
      const hasEssentialData = cachedData.returnOnEquity !== null && cachedData.dividendYield !== null;
      if (!hasEssentialData) {
        console.log(`⚠️ Cache incomplete for ${cleanSymbol} (missing ROE/DY). Forcing fresh fetch...`);
        // Não retornar cache, continuar para busca nova
      } else {
        // Debug específico para BBSE3 no cache
        if (cleanSymbol === 'BBSE3') {
          console.log(`🔍 BBSE3 CACHE Debug:`, {
            cached_roe: cachedData.returnOnEquity,
            cached_roe_display: cachedData.returnOnEquity ? `${(cachedData.returnOnEquity * 100).toFixed(2)}%` : 'null',
            cachedData_full: JSON.stringify(cachedData, null, 2)
          });
        }
        return cachedData;
      }
    }

    try {
      console.log(`🇧🇷 Fetching Fundamentals (v2) for ${cleanSymbol}...`);

      // 1. Chamar o novo endpoint de fundamentos da Brapi para dados consolidados
      const fundamentalsUrl = `${BRAPI_BASE_URL}/fundamentals/${cleanSymbol}?token=${this.apiKey}`;
      const fResponse = await fetch(fundamentalsUrl);

      let brapiFundamentals = {};

      // Verificar se a resposta é JSON válido
      const contentType = fResponse.headers.get('content-type');
      if (fResponse.ok && contentType && contentType.includes('application/json')) {
        try {
          const fData = await fResponse.json();
          if (fData.results && fData.results[0]) {
            brapiFundamentals = fData.results[0];
            console.log(`✅ Dedicated fundamentals loaded for ${cleanSymbol}`);
          }
        } catch (jsonError) {
          console.warn(`⚠️ Failed to parse fundamentals JSON for ${cleanSymbol}:`, jsonError.message);
        }
      } else {
        console.warn(`⚠️ Fundamentals endpoint returned non-JSON response for ${cleanSymbol}`);
      }

      // 2. Chamar o endpoint de quote para dados de preço e EPS básico (fallback)
      const quoteUrl = `${BRAPI_BASE_URL}/quote/${cleanSymbol}?fundamental=true&token=${this.apiKey}`;
      const qResponse = await fetch(quoteUrl);

      let qResult = {};
      const quoteContentType = qResponse.headers.get('content-type');
      if (qResponse.ok && quoteContentType && quoteContentType.includes('application/json')) {
        try {
          const qData = await qResponse.json();
          qResult = (qData.results && qData.results[0]) ? qData.results[0] : {};
        } catch (jsonError) {
          console.warn(`⚠️ Failed to parse quote JSON for ${cleanSymbol}:`, jsonError.message);
        }
      } else {
        console.warn(`⚠️ Quote endpoint returned non-JSON response for ${cleanSymbol}`);
      }

      // Mapeamento Inteligente baseado no Retorno Real da Brapi (pl, pvp, dy, roe, roic...)
      const fundamentals = {
        // Valuation (Brapi keys: pl, pvp)
        priceEarnings: brapiFundamentals.pl || qResult.priceEarnings || null,
        pe: brapiFundamentals.pl || qResult.priceEarnings || null,

        priceToBook: brapiFundamentals.pvp || qResult.priceToBook || null,
        pvp: brapiFundamentals.pvp || qResult.priceToBook || null,
        pbValue: brapiFundamentals.pvp || qResult.priceToBook || null,

        evToEbitda: brapiFundamentals.evEbitda || qResult.enterpriseValueToEbitda || null,
        priceToSales: brapiFundamentals.ps || qResult.priceToSalesTrailing12Months || null,

        // Rentabilidade (Brapi: roe, dy vêm em decimal, ex: 0.635 = 63.5%)
        // Log para identificar problemas com ROE
        roe: (() => {
          const roeValue = brapiFundamentals.roe || brapiFundamentals.returnOnEquity || (qResult.roe ? qResult.roe / 100 : null);
          console.log(`[LOG ROE] BrapiService mapping for ${cleanSymbol}:`, {
            brapiFundamentals_roe: brapiFundamentals.roe,
            brapiFundamentals_returnOnEquity: brapiFundamentals.returnOnEquity,
            qResult_roe: qResult.roe,
            final_roe: roeValue,
            final_roe_type: typeof roeValue
          });
          return roeValue;
        })(),
        returnOnEquity: (() => {
          const roeValue = brapiFundamentals.roe || brapiFundamentals.returnOnEquity || (qResult.roe ? qResult.roe / 100 : null);
          console.log(`[LOG ROE] BrapiService returnOnEquity for ${cleanSymbol}:`, {
            brapiFundamentals_roe: brapiFundamentals.roe,
            brapiFundamentals_returnOnEquity: brapiFundamentals.returnOnEquity,
            qResult_roe: qResult.roe,
            final_returnOnEquity: roeValue,
            final_returnOnEquity_type: typeof roeValue
          });
          return roeValue;
        })(),
        roic: brapiFundamentals.roic || null,
        liquidMargin: brapiFundamentals.margemLiquida || (qResult.liquidMargin ? qResult.liquidMargin / 100 : null),
        profitMargin: brapiFundamentals.margemLiquida || brapiFundamentals.profitMargin || (qResult.profitMargin ? qResult.profitMargin / 100 : null),
        roa: brapiFundamentals.roa || brapiFundamentals.returnOnAssets || (qResult.roa ? qResult.roa / 100 : null),
        returnOnAssets: brapiFundamentals.roa || brapiFundamentals.returnOnAssets || (qResult.roa ? qResult.roa / 100 : null),

        // Endividamento
        netDebtToEbitda: brapiFundamentals.dividaLiquidaEbitda || brapiFundamentals.netDebtToEbitda || null,
        debtEbitda: brapiFundamentals.dividaLiquidaEbitda || brapiFundamentals.netDebtToEbitda || null,
        debtToEbitda: brapiFundamentals.dividaLiquidaEbitda || brapiFundamentals.netDebtToEbitda || brapiFundamentals.debtToEbitda || null,
        currentLiquidity: brapiFundamentals.currentLiquidity || null,
        debtToEquity: brapiFundamentals.debtEquity || (qResult.debtToEquity ? qResult.debtToEquity / 100 : null),

        // Proventos
        dividendYield: brapiFundamentals.dy || (qResult.dividendYield ? qResult.dividendYield / 100 : null),
        dy: brapiFundamentals.dy || (qResult.dividendYield ? qResult.dividendYield ? qResult.dividendYield / 100 : null : null),
        lpa: brapiFundamentals.lucroPorAcao || qResult.earningsPerShare || null,
        vpa: brapiFundamentals.valorPatrimonialPorAcao || null,
        lastDividend: brapiFundamentals.ultimoDividendo || brapiFundamentals.lastDividend || null,

        // Crescimento e Outros
        revenueGrowth5y: brapiFundamentals.crescimentoReceita5Anos || null,
        revenueGrowth: brapiFundamentals.crescimentoReceita5Anos || brapiFundamentals.revenueGrowth || null,
        earningsGrowth: qResult.earningsGrowth || 0,

        sector: brapiFundamentals.setor || qResult.sector || 'N/A',
        industry: qResult.industry || 'N/A',
        updatedAt: brapiFundamentals.atualizadoEm || new Date().toISOString(),
        price: qResult.regularMarketPrice || qResult.price || 0,
      };

      // Log de debug para ver os dados mapeados
      console.log(`📊 Fundamentals mapped for ${cleanSymbol}:`, {
        pe: fundamentals.priceEarnings,
        roe: fundamentals.returnOnEquity,
        dy: fundamentals.dividendYield,
        pvp: fundamentals.priceToBook,
        lpa: fundamentals.lpa,
        profitMargin: fundamentals.profitMargin,
        debtToEbitda: fundamentals.debtToEbitda
      });

      // Cálculo de PEG Ratio se não existir
      if (fundamentals.pe && fundamentals.earningsGrowth) {
        fundamentals.pegRatio = fundamentals.pe / (fundamentals.earningsGrowth * 100);
      }

      // Adicionar Tendências (Comparação com snapshot anterior)
      const previous = await this.getTrendSnapshot(cleanSymbol);
      if (previous) {
        fundamentals.trends = {
          pe: fundamentals.pe > previous.pe ? 'up' : 'down',
          roe: fundamentals.roe > previous.roe ? 'up' : 'down',
          dy: fundamentals.dividendYield > previous.dividendYield ? 'up' : 'down',
        };
      }

      // Salva snapshot atual para futura comparação (se houver dados)
      if (fundamentals.pe) {
        await this.saveTrendSnapshot(cleanSymbol, fundamentals);
      }

      // ✅ ESTRATÉGIA DE ENRIQUECIMENTO HÍBRIDA (FUNDAMENTUS -> HG -> YAHOO -> FMP)
      if (fundamentals.roe === null || fundamentals.dividendYield === null || fundamentals.priceToBook === null) {
        console.log(`💡 Data gap for ${cleanSymbol}. Checking Fundamentus...`);

        // 1. Fundamentus (Gratuito e completo para ações brasileiras)
        const fundamentusData = await fundamentusService.getFundamentals(cleanSymbol);
        if (fundamentusData) {
          console.log(`✨ Enriched ${cleanSymbol} with Fundamentus data`);

          // Mapear dados do Fundamentus
          if (fundamentals.priceEarnings === null && fundamentusData.pl) fundamentals.priceEarnings = fundamentusData.pl;
          if (fundamentals.pe === null && fundamentusData.pl) fundamentals.pe = fundamentusData.pl;

          if (fundamentals.priceToBook === null && fundamentusData.pvp) fundamentals.priceToBook = fundamentusData.pvp;
          if (fundamentals.pvp === null && fundamentusData.pvp) fundamentals.pvp = fundamentusData.pvp;
          if (fundamentals.pbValue === null && fundamentusData.pvp) fundamentals.pbValue = fundamentusData.pvp;

          if (fundamentals.priceToSales === null && fundamentusData.psr) fundamentals.priceToSales = fundamentusData.psr;

          if (fundamentals.roe === null && fundamentusData.roe) fundamentals.roe = fundamentusData.roe / 100; // Converter de % para decimal
          if (fundamentals.returnOnEquity === null && fundamentusData.roe) fundamentals.returnOnEquity = fundamentusData.roe / 100;

          if (fundamentals.roic === null && fundamentusData.roic) fundamentals.roic = fundamentusData.roic / 100;

          if (fundamentals.dividendYield === null && fundamentusData.dividendYield) fundamentals.dividendYield = fundamentusData.dividendYield / 100;
          if (fundamentals.dy === null && fundamentusData.dividendYield) fundamentals.dy = fundamentusData.dividendYield / 100;

          if (fundamentals.liquidMargin === null && fundamentusData.margemLiquida) fundamentals.liquidMargin = fundamentusData.margemLiquida / 100;
          if (fundamentals.profitMargin === null && fundamentusData.margemLiquida) fundamentals.profitMargin = fundamentusData.margemLiquida / 100;

          if (fundamentals.evToEbitda === null && fundamentusData.evEbitda) fundamentals.evToEbitda = fundamentusData.evEbitda;

          if (fundamentals.debtToEbitda === null && fundamentusData.dividaBrutaPatrimonio) fundamentals.debtToEbitda = fundamentusData.dividaBrutaPatrimonio;
          if (fundamentals.netDebtToEbitda === null && fundamentusData.dividaBrutaPatrimonio) fundamentals.netDebtToEbitda = fundamentusData.dividaBrutaPatrimonio;

          if (fundamentals.revenueGrowth === null && fundamentusData.crescimentoReceita5a) fundamentals.revenueGrowth = fundamentusData.crescimentoReceita5a / 100;
          if (fundamentals.revenueGrowth5y === null && fundamentusData.crescimentoReceita5a) fundamentals.revenueGrowth5y = fundamentusData.crescimentoReceita5a / 100;
        }

        // 2. HG Brasil (Especialista B3) - apenas se ainda houver gaps
        const hgData = await hgService.getFundamentalData(cleanSymbol);
        if (hgData) {
          console.log(`✨ Enriched ${cleanSymbol} with HG Brasil data`);
          if (fundamentals.roe === null) fundamentals.roe = hgData.roe;
          if (fundamentals.dividendYield === null) fundamentals.dividendYield = hgData.dividendYield;
          if (fundamentals.priceToBook === null) fundamentals.priceToBook = hgData.priceToBook;
          if (fundamentals.priceEarnings === null) fundamentals.priceEarnings = hgData.priceEarnings;
        }

        // 2. Yahoo Finance Fallback
        if (fundamentals.roe === null || fundamentals.dividendYield === null) {
          console.log(`💡 Still gaps for ${cleanSymbol}. Checking Yahoo Finance...`);
          const yahooData = await yahooService.getFundamentalData(cleanSymbol);
          if (yahooData) {
            console.log(`✨ Enriched ${cleanSymbol} with Yahoo Finance data`);
            if (fundamentals.roe === null) fundamentals.roe = yahooData.roe;
            if (fundamentals.dividendYield === null) fundamentals.dividendYield = yahooData.dividendYield;
            if (fundamentals.priceToBook === null) fundamentals.priceToBook = yahooData.priceToBook;
          }
        }

        // 3. Alpha Vantage Fallback (Stocks US/Internacionais)
        if (fundamentals.roe === null || fundamentals.dividendYield === null) {
          console.log(`💡 Still gaps for ${cleanSymbol}. Checking Alpha Vantage...`);
          const alphaData = await alphaVantageService.getFundamentalData(cleanSymbol);
          if (alphaData) {
            console.log(`✨ Enriched ${cleanSymbol} with Alpha Vantage data:`, {
              roe: alphaData.returnOnEquity,
              dy: alphaData.dividendYield,
              pe: alphaData.priceEarnings,
              pvp: alphaData.priceToBook
            });
            if (fundamentals.roe === null && alphaData.roe !== null) fundamentals.roe = alphaData.roe / 100; // Alpha Vantage retorna em %
            if (fundamentals.returnOnEquity === null && alphaData.returnOnEquity !== null) fundamentals.returnOnEquity = alphaData.returnOnEquity / 100; // Alpha Vantage retorna em %
            if (fundamentals.dividendYield === null && alphaData.dividendYield !== null) fundamentals.dividendYield = alphaData.dividendYield / 100; // Alpha Vantage retorna em %
            if (fundamentals.priceToBook === null) fundamentals.priceToBook = alphaData.priceToBook;
            if (fundamentals.priceEarnings === null) fundamentals.priceEarnings = alphaData.priceEarnings;
          }
        }

        // 4. FMP Fallback (Global)
        if (fundamentals.roe === null || fundamentals.dividendYield === null) {
          const fmpData = await fmpService.getFundamentalMetrics(cleanSymbol);
          if (fmpData) {
            console.log(`✨ Enriched ${cleanSymbol} with FMP data`);
            if (fundamentals.roe === null) fundamentals.roe = fmpData.roe;
            if (fundamentals.dividendYield === null) fundamentals.dividendYield = fmpData.dividendYield;
          }
        }
      }

      await this.saveToCache(cleanSymbol, fundamentals);
      console.log(`📊 Fundamentals for ${cleanSymbol}: DY=${fundamentals.dividendYield}%, P/L=${fundamentals.priceEarnings}`);
      return fundamentals;
    } catch (error) {
      console.error(`❌ Error fetching fundamentals for ${symbol}:`, error);

      // 🚨 BRAPI FALHOU - FORÇAR FALLBACKS ANTES DE RETORNAR MOCK
      console.log(`🔄 Brapi failed for ${cleanSymbol}. Forcing fallback enrichment...`);

      let fundamentals = {
        priceEarnings: null,
        pe: null,
        priceToBook: null,
        pvp: null,
        pbValue: null,
        evToEbitda: null,
        priceToSales: null,
        roe: null,
        returnOnEquity: null,
        roic: null,
        liquidMargin: null,
        profitMargin: null,
        roa: null,
        returnOnAssets: null,
        netDebtToEbitda: null,
        debtEbitda: null,
        debtToEbitda: null,
        currentLiquidity: null,
        debtToEquity: null,
        dividendYield: null,
        dy: null,
        lpa: null,
        vpa: null,
        lastDividend: null,
        revenueGrowth5y: null,
        revenueGrowth: null,
        earningsGrowth: 0,
        sector: 'N/A',
        industry: 'N/A',
        updatedAt: new Date().toISOString(),
        price: 0,
      };

      // ✅ FORÇAR ESTRATÉGIA DE ENRIQUECIMENTO HÍBRIDA MESMO COM BRAPI DOWN
      console.log(`💡 Forcing fallback enrichment for ${cleanSymbol}...`);

      // 1. Fundamentus (Gratuito e completo para ações brasileiras)
      try {
        const fundamentusData = await fundamentusService.getFundamentals(cleanSymbol);
        if (fundamentusData) {
          console.log(`✨ Enriched ${cleanSymbol} with Fundamentus data (fallback)`);

          // Mapear dados do Fundamentus
          if (fundamentusData.pl) {
            fundamentals.priceEarnings = fundamentusData.pl;
            fundamentals.pe = fundamentusData.pl;
          }

          if (fundamentusData.pvp) {
            fundamentals.priceToBook = fundamentusData.pvp;
            fundamentals.pvp = fundamentusData.pvp;
            fundamentals.pbValue = fundamentusData.pvp;
          }

          if (fundamentusData.psr) fundamentals.priceToSales = fundamentusData.psr;

          if (fundamentusData.roe) {
            fundamentals.roe = fundamentusData.roe / 100; // Converter de % para decimal
            fundamentals.returnOnEquity = fundamentusData.roe / 100;
          }

          if (fundamentusData.roic) fundamentals.roic = fundamentusData.roic / 100;

          if (fundamentusData.dividendYield) {
            fundamentals.dividendYield = fundamentusData.dividendYield / 100;
            fundamentals.dy = fundamentusData.dividendYield / 100;
          }

          if (fundamentusData.margemLiquida) {
            fundamentals.liquidMargin = fundamentusData.margemLiquida / 100;
            fundamentals.profitMargin = fundamentusData.margemLiquida / 100;
          }

          if (fundamentusData.evEbitda) fundamentals.evToEbitda = fundamentusData.evEbitda;

          if (fundamentusData.dividaBrutaPatrimonio) {
            fundamentals.debtToEbitda = fundamentusData.dividaBrutaPatrimonio;
            fundamentals.netDebtToEbitda = fundamentusData.dividaBrutaPatrimonio;
          }

          if (fundamentusData.crescimentoReceita5a) {
            fundamentals.revenueGrowth = fundamentusData.crescimentoReceita5a / 100;
            fundamentals.revenueGrowth5y = fundamentusData.crescimentoReceita5a / 100;
          }
        }
      } catch (fundamentusError) {
        console.warn(`⚠️ Fundamentus fallback failed for ${cleanSymbol}:`, fundamentusError.message);
      }

      // 2. HG Brasil (Especialista B3)
      if (fundamentals.roe === null || fundamentals.dividendYield === null) {
        try {
          const hgData = await hgService.getFundamentalData(cleanSymbol);
          if (hgData) {
            console.log(`✨ Enriched ${cleanSymbol} with HG Brasil data (fallback)`);
            if (fundamentals.roe === null) fundamentals.roe = hgData.roe;
            if (fundamentals.returnOnEquity === null) fundamentals.returnOnEquity = hgData.roe;
            if (fundamentals.dividendYield === null) fundamentals.dividendYield = hgData.dividendYield;
            if (fundamentals.dy === null) fundamentals.dy = hgData.dividendYield;
            if (fundamentals.priceToBook === null) fundamentals.priceToBook = hgData.priceToBook;
            if (fundamentals.priceEarnings === null) fundamentals.priceEarnings = hgData.priceEarnings;
          }
        } catch (hgError) {
          console.warn(`⚠️ HG Brasil fallback failed for ${cleanSymbol}:`, hgError.message);
        }
      }

      // 3. Yahoo Finance Fallback
      if (fundamentals.roe === null || fundamentals.dividendYield === null) {
        try {
          const yahooData = await yahooService.getFundamentalData(cleanSymbol);
          if (yahooData) {
            console.log(`✨ Enriched ${cleanSymbol} with Yahoo Finance data (fallback)`);
            if (fundamentals.roe === null) fundamentals.roe = yahooData.roe;
            if (fundamentals.returnOnEquity === null) fundamentals.returnOnEquity = yahooData.roe;
            if (fundamentals.dividendYield === null) fundamentals.dividendYield = yahooData.dividendYield;
            if (fundamentals.dy === null) fundamentals.dy = yahooData.dividendYield;
            if (fundamentals.priceToBook === null) fundamentals.priceToBook = yahooData.priceToBook;
          }
        } catch (yahooError) {
          console.warn(`⚠️ Yahoo Finance fallback failed for ${cleanSymbol}:`, yahooError.message);
        }
      }

      // 4. Alpha Vantage Fallback
      if (fundamentals.roe === null || fundamentals.dividendYield === null) {
        try {
          const alphaData = await alphaVantageService.getFundamentalData(cleanSymbol);
          if (alphaData) {
            console.log(`✨ Enriched ${cleanSymbol} with Alpha Vantage data (fallback):`, {
              roe: alphaData.returnOnEquity,
              dy: alphaData.dividendYield,
              pe: alphaData.priceEarnings,
              pvp: alphaData.priceToBook
            });
            if (fundamentals.roe === null && alphaData.roe !== null) fundamentals.roe = alphaData.roe / 100;
            if (fundamentals.returnOnEquity === null && alphaData.returnOnEquity !== null) fundamentals.returnOnEquity = alphaData.returnOnEquity / 100;
            if (fundamentals.dividendYield === null && alphaData.dividendYield !== null) fundamentals.dividendYield = alphaData.dividendYield / 100;
            if (fundamentals.dy === null && alphaData.dividendYield !== null) fundamentals.dy = alphaData.dividendYield / 100;
            if (fundamentals.priceToBook === null) fundamentals.priceToBook = alphaData.priceToBook;
            if (fundamentals.priceEarnings === null) fundamentals.priceEarnings = alphaData.priceEarnings;
          }
        } catch (alphaError) {
          console.warn(`⚠️ Alpha Vantage fallback failed for ${cleanSymbol}:`, alphaError.message);
        }
      }

      // 5. FMP Fallback (Global)
      if (fundamentals.roe === null || fundamentals.dividendYield === null) {
        try {
          const fmpData = await fmpService.getFundamentalMetrics(cleanSymbol);
          if (fmpData) {
            console.log(`✨ Enriched ${cleanSymbol} with FMP data (fallback)`);
            if (fundamentals.roe === null) fundamentals.roe = fmpData.roe;
            if (fundamentals.returnOnEquity === null) fundamentals.returnOnEquity = fmpData.roe;
            if (fundamentals.dividendYield === null) fundamentals.dividendYield = fmpData.dividendYield;
            if (fundamentals.dy === null) fundamentals.dy = fmpData.dividendYield;
          }
        } catch (fmpError) {
          console.warn(`⚠️ FMP fallback failed for ${cleanSymbol}:`, fmpError.message);
        }
      }

      // Salvar no cache apenas se conseguiu dados essenciais
      if (fundamentals.returnOnEquity !== null || fundamentals.dividendYield !== null) {
        await this.saveToCache(cleanSymbol, fundamentals);
        console.log(`💾 Saved fallback data to cache for ${cleanSymbol}`);
      }

      console.log(`📊 Fallback Fundamentals for ${cleanSymbol}: ROE=${fundamentals.returnOnEquity}, DY=${fundamentals.dividendYield}`);

      // Retornar dados do fallback se conseguiu algo, senão mock
      if (fundamentals.returnOnEquity !== null || fundamentals.dividendYield !== null) {
        return fundamentals;
      } else {
        console.log(`❌ All fallbacks failed for ${cleanSymbol}, returning mock data`);
        return this.getMockFundamentals();
      }
    }
  }

  getMockFundamentals() {
    // Retorna objeto com valores null para que a UI exiba "N/A"
    // em vez de valores fictícios que podem confundir o usuário
    return {
      priceEarnings: null,
      priceToBook: null,
      roe: null,
      dividendYield: null,
      netDebtToEbitda: null,
      evToEbitda: null,
      profitMargin: null,
      returnOnAssets: null,
      priceToSales: null,
      revenueGrowth: null,
      debtToEbitda: null,
      lastDividend: null,
      sector: 'N/A',
      updatedAt: new Date().toISOString()
    };
  }

  async getPriceHistory(symbol, range = '1y') {
    try {
      const cleanSymbol = symbol.trim().toUpperCase();
      const url = `${BRAPI_BASE_URL}/quote/${cleanSymbol}?range=${range}&interval=1d&token=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok || !data.results) return [];
      const historicalData = data.results[0].historicalDataPrice || [];
      return historicalData.map(item => ({
        date: item.date,
        price: item.close,
        volume: item.volume
      }));
    } catch (error) {
      return [];
    }
  }
}

const brapiService = new BrapiService();
export default brapiService;