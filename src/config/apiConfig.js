import {
  BRAPI_API_KEY,
  ALPHA_VANTAGE_API_KEY,
  COINGECKO_API_KEY,
  FMP_API_KEY,
  GEMINI_API_KEY,
} from '@env';

/**
 * Carrega as variáveis de ambiente. Em um ambiente React Native, isso geralmente é feito
 * com um pacote como 'react-native-dotenv'. Para a web, pode ser 'dotenv'.
 * As chaves agora devem ser definidas em um arquivo .env na raiz do projeto.
 */
export const API_CONFIG = {
  // ========== ALPHA VANTAGE (Stocks US) ==========
  alphaVantage: {
    // Ex: ALPHA_VANTAGE_API_KEY=JJ8R7MU3IJIGPLOY
    apiKey: '9LI8JSRN6TW81UBJ', // Chave configurada para uso
    baseUrl: 'https://www.alphavantage.co/query',
    timeout: 10000, // 10 segundos
    rateLimit: {
      maxRequests: 25,
      perDay: true,
    },
  },

  // ========== COINGECKO (Crypto) ==========
  coinGecko: {
    // Ex: COINGECKO_API_KEY=sua_chave_aqui
    apiKey: COINGECKO_API_KEY, // Opcional, mas recomendado
    baseUrl: 'https://api.coingecko.com/api/v3',
    timeout: 8000, // 8 segundos
    rateLimit: {
      maxRequests: 50,
      perMinute: true,
    },
  },

  // ========== BRAPI (Ativos BR) ==========
  brapi: {
    // Ex: BRAPI_API_KEY=seu_token_aqui
    apiKey: BRAPI_API_KEY,
    baseUrl: 'https://brapi.dev/api',
    timeout: 10000, // 10 segundos
    rateLimit: {
      maxRequests: 100,
      perMinute: true,
    },
  },

  // ========== FINANCIAL MODELING PREP (FMP - Stocks US Fallback) ==========
  financialModelingPrep: {
    // Ex: FMP_API_KEY=sua_chave_aqui
    apiKey: FMP_API_KEY,
    baseUrl: 'https://financialmodelingprep.com/api/v3',
    timeout: 10000, // 10 segundos
    rateLimit: {
      maxRequests: 250, // Exemplo, verifique a documentação da FMP
      perDay: true,
    },
    // Nota: A FMP pode ter diferentes endpoints para dados que a Alpha Vantage oferece.
    // Adaptações podem ser necessárias na camada de serviço.
  },

  // ========== EXCHANGERATE (Conversão USD/BRL) ==========
  exchangeRate: {
    baseUrl: 'https://economia.awesomeapi.com.br',
    timeout: 5000, // 5 segundos
    // API pública, sem chave necessária
  },

  // ========== GOOGLE GEMINI (AI Analysis) ==========
  gemini: {
    apiKey: GEMINI_API_KEY,
    model: 'gemini-1.5-flash',
    timeout: 30000, // 30 segundos para análise complexa
  },

  // ========== CONFIGURAÇÕES GLOBAIS ==========
  cache: {
    ttl: 4 * 60 * 60 * 1000, // 4 horas
    enabled: true,
  },

  retry: {
    maxAttempts: 3,
    delayMs: 2000, // 2 segundos entre tentativas
  },

  fallback: {
    useMockOnError: true, // Volta para mock se API falhar
  },
};

/**
 * Helpers: Verificam se as chaves de API para serviços específicos foram definidas.
 * Isso evita que o app tente usar chaves de exemplo ou vazias.
 */
export const isBrapiConfigured = () => !!API_CONFIG.brapi.apiKey && API_CONFIG.brapi.apiKey.length > 5;

export const isAlphaVantageConfigured = () => !!API_CONFIG.alphaVantage.apiKey;

export const isCoinGeckoConfigured = () => !!API_CONFIG.coinGecko.apiKey;

/**
 * Helper: Verifica se TODAS as chaves de API essenciais foram definidas.
 * Útil para um check geral na inicialização do app.
 */
export const areAllAPIsConfigured = () => {
  const status = {
    brapi: !!API_CONFIG.brapi.apiKey,
    gemini: !!API_CONFIG.gemini.apiKey,
    alpha: !!API_CONFIG.alphaVantage.apiKey,
  };
  console.log('[API Config] Chaves carregadas:', status);
  if (!status.gemini) {
    console.warn('[API Config] AVISO: GEMINI_API_KEY não foi detectada!');
  }
  return isBrapiConfigured() && isAlphaVantageConfigured() && isCoinGeckoConfigured();
};

/**
 * Helper: Retorna URL completa com query params
 */
export const buildURL = (baseUrl, endpoint, params = {}) => {
  const url = new URL(endpoint, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, value);
    }
  });
  return url.toString();
};

/**
 * Helper: Log de requisições (útil para debug)
 */
export const logAPICall = (service, endpoint, status) => {
  const timestamp = new Date().toISOString();
  console.log(`[API] ${timestamp} | ${service} | ${endpoint} | ${status}`);
};
