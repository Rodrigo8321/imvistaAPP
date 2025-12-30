import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildURL, logAPICall } from '../config/apiConfig';
import { BRAPI_API_KEY } from '@env';
import Brapi from 'brapi';

// ========== CACHE MANAGER ==========
const CACHE_KEYS = {
  // NOTA: O cache de cotações individuais agora expira em 4 horas.
  QUOTE: 'market_quote_',
  EXCHANGE_RATE: 'exchange_rate_USDBRL',
};

const saveToCache = async (key, data) => {
  try {
    const cacheData = { data, timestamp: Date.now() };
    await AsyncStorage.setItem(key, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('❌ Cache save error:', error.message);
  }
};

const getFromCache = async (key) => {
  try {
    const cached = await AsyncStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age < API_CONFIG.cache.ttl) {
      console.log(`✅ Cache HIT: ${key} (${Math.round(age / 1000)}s old)`);
      return data;
    } else {
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }
  } catch (error) {
    return null;
  }
};

// ========== MAPEAMENTO DE CRYPTO IDs ==========
const CRYPTO_ID_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  ADA: 'cardano',
  SOL: 'solana',
  DOGE: 'dogecoin',
  MATIC: 'matic-network',
};

// ========== CLIENTE DA SDK BRAPI (LAZY INITIALIZATION) ==========
let brapiClient = null;

const getBrapiClient = () => {
  if (!brapiClient) {
    console.log('[DEBUG] Initializing Brapi Client...');
    console.log(`[DEBUG] Token loaded: ${BRAPI_API_KEY ? `...${BRAPI_API_KEY.slice(-4)}` : '❌ NOT FOUND'
      }`);

    // ✅ Validação do token
    if (!BRAPI_API_KEY) {
      console.error('❌ CRITICAL ERROR: BRAPI_API_KEY is undefined!');
      throw new Error('❌ BRAPI_API_KEY não encontrado no .env. Verifique o arquivo .env e reinicie o app.');
    }

    brapiClient = new Brapi({ apiKey: BRAPI_API_KEY });
    console.log('✅ Brapi client initialized successfully');
  }
  return brapiClient;
};

// ========== BRAPI (ATIVOS BRASILEIROS) - CORRIGIDO ==========
const fetchBrapiQuote = async (ticker) => {
  try {
    console.log(`🇧🇷 Fetching Brapi: ${ticker}...`);

    // Utiliza a SDK oficial da Brapi através do getter
    const client = getBrapiClient();

    // ✅ Log do token para debug
    console.log('[DEBUG] Token being used for request:', BRAPI_API_KEY ? `...${BRAPI_API_KEY.slice(-4)}` : 'UNDEFINED');

    const json = await client.quote.retrieve(ticker);

    // ✅ ADICIONAR - Log completo da resposta
    console.log(`[DEBUG] Raw response for ${ticker}:`, JSON.stringify(json, null, 2));

    if (!json.results || json.results.length === 0) {
      console.error(`❌ No results for ${ticker}. Response:`, json);
      throw new Error('No data from Brapi');
    }

    // A SDK já trata erros de autenticação e rede, simplificando o código.
    // Se o token for inválido, a SDK lançará um erro que será capturado pelo catch.
    const quote = json.results[0];

    // ✅ ADICIONAR - Log do quote individual
    console.log(`[DEBUG] Quote data for ${ticker}:`, {
      symbol: quote.symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketPreviousClose: quote.regularMarketPreviousClose,
    });

    logAPICall('Brapi', ticker, 'SUCCESS');

    const result = {
      price: quote.regularMarketPrice || quote.regularMarketPreviousClose,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
      high: quote.regularMarketDayHigh, // Corrigido
      low: quote.regularMarketDayLow, // Corrigido
      open: quote.regularMarketOpen, // Corrigido
      previousClose: quote.regularMarketPreviousClose, // Corrigido
      updatedAt: new Date().toISOString(),
    };

    // ✅ ADICIONAR - Log do resultado final
    console.log(`✅ Formatted result for ${ticker}:`, result);

    return result;
  } catch (error) {
    const isNotFound = error.message.includes('404');
    const isUnauthorized = error.message.includes('401');

    const errorMessage = isUnauthorized ? 'ERROR: Invalid Token' : `ERROR: ${error.message}`;
    logAPICall('Brapi', ticker, isNotFound ? `WARN: Ticker not found` : errorMessage);

    // ✅ ADICIONAR - Log detalhado do erro
    console.error(`❌ Error fetching ${ticker}:`, {
      message: error.message,
      isNotFound,
      isUnauthorized,
    });

    throw error;
  }
};

// ========== ALPHA VANTAGE (STOCKS US) - CORRIGIDO ==========
const fetchAlphaVantageQuote = async (ticker) => {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_CONFIG.alphaVantage.apiKey}`;

    console.log(`🇺🇸 Fetching Alpha Vantage: ${ticker}...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Alpha Vantage HTTP ${response.status}`);
    }

    const json = await response.json();

    // CORREÇÃO: Melhor verificação de erros
    if (json['Error Message']) {
      throw new Error('Invalid ticker');
    }

    if (json['Note']) {
      throw new Error('API rate limit (25/day)');
    }

    if (json['Information']) {
      throw new Error('API call frequency limit');
    }

    const quote = json['Global Quote'];

    // CORREÇÃO: Verifica se quote tem dados
    if (!quote || !quote['05. price']) {
      throw new Error('Empty response from API');
    }

    logAPICall('Alpha Vantage', ticker, 'SUCCESS');

    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change'] || 0),
      changePercent: parseFloat((quote['10. change percent'] || '0').replace('%', '')),
      volume: parseInt(quote['06. volume'] || 0),
      high: parseFloat(quote['03. high'] || 0),
      low: parseFloat(quote['04. low'] || 0),
      open: parseFloat(quote['02. open'] || 0),
      previousClose: parseFloat(quote['08. previous close'] || 0),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logAPICall('Alpha Vantage', ticker, `ERROR: ${error.message}`);
    throw error;
  }
};

// ========== COINGECKO (CRYPTO) - CORRIGIDO ==========
const fetchCoinGeckoQuote = async (ticker) => {
  try {
    // CORREÇÃO: Usa mapeamento correto de IDs
    const coinId = CRYPTO_ID_MAP[ticker.toUpperCase()] || ticker.toLowerCase();

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

    console.log(`💰 Fetching CoinGecko: ${coinId}...`);

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko HTTP ${response.status} - Invalid coin ID: ${coinId}`);
    }

    const json = await response.json();

    if (!json.market_data) {
      throw new Error('No market data from CoinGecko');
    }

    const market = json.market_data;

    logAPICall('CoinGecko', coinId, 'SUCCESS');

    return {
      price: market.current_price.usd,
      change: market.price_change_24h || 0,
      changePercent: market.price_change_percentage_24h || 0,
      volume: market.total_volume.usd || 0,
      marketCap: market.market_cap.usd || 0,
      high: market.high_24h.usd || 0,
      low: market.low_24h.usd || 0,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logAPICall('CoinGecko', ticker, `ERROR: ${error.message}`);
    throw error;
  }
};

// ========== TAXA DE CÂMBIO - CORRIGIDO ==========
export const fetchExchangeRate = async () => {
  try {
    // CORREÇÃO: Verifica cache primeiro (reduz requisições)
    if (API_CONFIG.cache.enabled) {
      const cached = await getFromCache(CACHE_KEYS.EXCHANGE_RATE);
      if (cached && typeof cached === 'number' && !isNaN(cached)) {
        console.log(`✅ ExchangeRate: USD/BRL = ${cached.toFixed(2)} (cached)`);
        return cached;
      }
    }

    const url = 'https://economia.awesomeapi.com.br/json/last/USD-BRL';

    console.log('💱 Fetching exchange rate USD/BRL...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'InvistaApp/1.0',
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`Exchange Rate API HTTP ${response.status}`);
    }

    const json = await response.json();

    if (!json || !json.USDBRL || !json.USDBRL.bid) {
      throw new Error('Resposta da API de câmbio inválida');
    }

    const rate = parseFloat(json.USDBRL.bid);

    if (isNaN(rate) || rate <= 0) {
      throw new Error('Taxa de câmbio inválida recebida da API');
    }

    logAPICall('ExchangeRate', 'USD/BRL', 'SUCCESS');
    console.log(`✅ ExchangeRate: USD/BRL = ${rate.toFixed(2)}`);

    // Salva no cache
    await saveToCache(CACHE_KEYS.EXCHANGE_RATE, rate);

    return rate;
  } catch (error) {
    logAPICall('ExchangeRate', 'USD/BRL', `ERROR: ${error.message}`);
    // Fallback: tenta buscar do cache expirado
    try {
      const expiredCache = await AsyncStorage.getItem(CACHE_KEYS.EXCHANGE_RATE);
      if (expiredCache) {
        const { data } = JSON.parse(expiredCache);
        if (typeof data === 'number' && !isNaN(data) && data > 0) {
          console.warn(`⚠️ Using expired cache exchange rate: ${data.toFixed(2)}`);
          return data;
        }
      }
    } catch { }

    // Fallback final
    console.warn('⚠️ Using fallback exchange rate: 5.00');
    return 5.00;
  }
};

// ========== ORQUESTRADOR PRINCIPAL ==========
export const fetchQuote = async (asset, forceRefresh = false) => {
  const cleanTicker = (asset.ticker || '').replace(/['"]/g, '').trim().toUpperCase();
  const cacheKey = `${CACHE_KEYS.QUOTE}${cleanTicker}`;

  try {
    // Verificação de Cache (pula se forceRefresh)
    if (API_CONFIG.cache.enabled && !forceRefresh) {
      const cached = await getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let quote;

    // Detecta tipo e chama API correta
    if (asset.type === 'Ação' || asset.type === 'FII') {
      quote = await fetchBrapiQuote(cleanTicker);
    } else if (asset.type === 'Stock' || asset.type === 'REIT' || asset.type === 'ETF') {
      quote = await fetchAlphaVantageQuote(cleanTicker);
    } else if (asset.type === 'Crypto') {
      quote = await fetchCoinGeckoQuote(cleanTicker);
    } else {
      throw new Error(`Unknown asset type: ${asset.type}`);
    }

    // Salva no cache se habilitado
    if (API_CONFIG.cache.enabled && quote && !quote.isMock) {
      await saveToCache(cacheKey, quote);
    }

    return quote;
  } catch (error) {
    const isRateLimit = error.message.includes('frequency limit') || error.message.includes('rate limit');

    if (isRateLimit) {
      console.warn(`⏳ Rate limit for ${cleanTicker} (${asset.type}). Using fallback.`);
    } else {
      console.warn(`⚠️ Failed to fetch ${cleanTicker}: ${error.message}`);
    }

    // Fallback para mock data
    if (API_CONFIG.fallback.useMockOnError) {
      if (!isRateLimit) console.log(`🔄 Using mock data for ${asset.ticker}`); // Only log extra info if not rate limit (too common)
      return {
        price: asset.currentPrice || 0,
        change: (asset.currentPrice || 0) - (asset.averagePrice || 0),
        changePercent: asset.averagePrice > 0
          ? (((asset.currentPrice || 0) - asset.averagePrice) / asset.averagePrice) * 100
          : 0,
        volume: 1000000,
        marketCap: 0,
        high: asset.currentPrice || 0,
        low: asset.currentPrice || 0,
        open: asset.currentPrice || 0,
        previousClose: asset.averagePrice || 0,
        updatedAt: new Date().toISOString(),
        fundamentals: asset.fundamentals, // Preserva os fundamentos originais no mock
        isMock: true,
      };
    }

    throw error;
  }
};

// ========== LIMPEZA DE CACHE ==========
export const clearCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k =>
      k.startsWith(CACHE_KEYS.QUOTE) ||
      k === CACHE_KEYS.EXCHANGE_RATE
    );
    await AsyncStorage.multiRemove(cacheKeys);
    console.log(`🗑️ Cache cleared: ${cacheKeys.length} items removed`);
  } catch (error) {
    console.error('❌ Cache clear error:', error.message);
  }
};

// ========== LIMPEZA DE CACHE DE PESQUISA ==========
export const clearSearchCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    // Remove caches relacionados à pesquisa de tickers e dados corrompidos
    const searchCacheKeys = keys.filter(k =>
      k.includes('search') ||
      k.includes('BBSE3') ||
      k.includes('ticker') ||
      k.startsWith('market_quote_BBSE3') ||
      // Remove caches que podem ter dados undefined/null
      (k.startsWith('market_quote_') && k.length > 20)
    );

    if (searchCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(searchCacheKeys);
      console.log(`🗑️ Search cache cleared: ${searchCacheKeys.length} items removed`);
      console.log('Removed keys:', searchCacheKeys);
    } else {
      console.log('ℹ️ No search cache found to clear');
    }

    return { success: true, removed: searchCacheKeys.length };
  } catch (error) {
    console.error('❌ Search cache clear error:', error.message);
    return { success: false, error: error.message };
  }
};

// ========== FIND TICKER FUNCTION (EXPERIMENTAL) ==========
export const findTicker = async (ticker) => {
  try {
    // Normaliza o ticker para maiúsculas para garantir consistência na busca
    const searchTerm = ticker.toUpperCase();

    const url = `${API_CONFIG.brapi.baseUrl}/quote/list?search=${searchTerm}`;
    console.log(`[DEBUG] Searching for ticker: ${searchTerm}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BRAPI_API_KEY}`,  // ✅ CORRIGIDO
      },
    });
    const json = await response.json();
    console.log(`[DEBUG] Ticker search result for "${searchTerm}":`, JSON.stringify(json, null, 2));
    return json;
  } catch (error) {
    console.error(`[DEBUG] Error in findTicker for "${ticker}":`, error.message);
    return null;
  }
};

// ========== TEST FUNCTIONS ==========
export const testFindTicker = async () => {
  try {
    console.log('[DEBUG] Running testFindTicker...');
    await findTicker('BBSE3');
    console.log('[DEBUG] testFindTicker finished.');
    return { success: true };
  } catch (error) {
    console.error('[DEBUG] testFindTicker failed:', error.message);
    return { success: false, error: error.message };
  }
};

export const testQuotesApi = async () => {
  try {
    // Test with a sample asset
    const testAsset = { ticker: 'PETR4', type: 'Ação' };
    await fetchQuote(testAsset);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const testExchangeRateApi = async () => {
  try {
    await fetchExchangeRate();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};