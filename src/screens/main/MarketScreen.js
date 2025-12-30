  import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from '../../components/common/Gradient';
import colors from '../../styles/colors';
import { fetchQuote } from '../../services/marketService';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { useNavigation } from '@react-navigation/native';



const IndexCard = ({ name, value, change, changePercent, isCrypto }) => {
  const isPositive = change >= 0;
  return (
    <View style={styles.indexCard}>
      <View style={styles.indexHeader}>
        <Text style={styles.indexName}>{name}</Text>
        <Text style={[styles.indexChange, { color: isPositive ? colors.success : colors.danger }]}>
          {isPositive ? '+' : ''}{formatPercent(changePercent)}
        </Text>
      </View>
      <Text style={styles.indexValue}>
        {isCrypto ? `$${value.toLocaleString()}` : value.toLocaleString()}
      </Text>
    </View>
  );
};



const MarketScreen = () => {
  const [marketData, setMarketData] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('geral'); // 'geral' | 'crypto'
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = useNavigation();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const cleanSymbol = searchQuery.trim().toUpperCase();
      console.log(`[MARKET NAV] MarketScreen navigating to AssetDetails for ${cleanSymbol}:`, {
        searchQuery,
        cleanSymbol,
        navigationParams: {
          symbol: cleanSymbol,
          asset: { ticker: cleanSymbol }
        }
      });
      navigation.navigate('AssetDetails', {
        symbol: cleanSymbol,
        asset: { ticker: cleanSymbol } // Formato unificado: apenas symbol e asset (opcional)
      });
      setSearchQuery('');
    }
  };

  const loadMarketData = async () => {
    try {
      setLoading(true);

      // 1. Definir Ativos para Buscar
      const indicesToFetch = [
        { ticker: '^BVSP', type: 'Ação', name: 'IBOV' }, // Brapi suporta indices com ^
        { ticker: 'USDBRL', type: 'Ação', name: 'Dólar' }, // Brapi Currency
      ];

      const cryptosToFetch = [
        { ticker: 'BTC', type: 'Crypto', name: 'Bitcoin' },
        { ticker: 'ETH', type: 'Crypto', name: 'Ethereum' },
        { ticker: 'SOL', type: 'Crypto', name: 'Solana' },
        { ticker: 'BNB', type: 'Crypto', name: 'Binance Coin' },
      ];

      // 2. Buscar Indices
      // Nota: Indices reais podem precisar de adaptadores específicos se o fetchQuote não suportar '^'
      // Para garantir, vamos focar nos Cryptos que o usuário pediu e simular IBOV se falhar ou usar um ticker proxy
      // Vamos tentar usar tickers de ETFs como proxy se o indice falhar: BOVA11, IVVB11 = SPX

      const indicesPromises = [
        fetchQuote({ ticker: 'BOVA11', type: 'Ação' }).then(d => ({ ...d, name: 'IBOV (ETF)' })),
        fetchQuote({ ticker: 'IVVB11', type: 'Ação' }).then(d => ({ ...d, name: 'S&P 500 (ETF)' })),
      ];

      const cryptoPromises = cryptosToFetch.map(c =>
        fetchQuote({ ticker: c.ticker, type: 'Crypto' }).then(d => ({ ...d, name: c.name, isCrypto: true }))
      );

      const [indicesResults, cryptoResults] = await Promise.all([
        Promise.allSettled(indicesPromises),
        Promise.allSettled(cryptoPromises)
      ]);

      const validIndices = indicesResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      const validCryptos = cryptoResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      setMarketData(validIndices);
      setCryptoData(validCryptos);

    } catch (error) {
      console.error("Erro ao carregar mercado:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderTickers = () => {
    const data = activeTab === 'geral' ? [...marketData, ...cryptoData.slice(0, 2)] : cryptoData;

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerContent}>
        {data.map((item, idx) => (
          <IndexCard
            key={idx}
            name={item.name}
            value={item.price}
            change={item.change}
            changePercent={item.changePercent}
            isCrypto={item.isCrypto}
          />
        ))}
      </ScrollView>
    );
  };



  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Mercado</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Analisar qualquer ticker (ex: PETR4, AAPL)"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            autoCapitalize="characters"
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity
          style={styles.compareShortcut}
          onPress={() => navigation.navigate('StockComparison')}
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.compareGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="git-compare-outline" size={20} color={colors.primary} />
            <Text style={styles.compareText}>Duelo de Ativos Side-by-Side</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'geral' && styles.activeTab]}
            onPress={() => setActiveTab('geral')}
          >
            <Text style={[styles.tabText, activeTab === 'geral' && styles.activeTabText]}>Geral</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'crypto' && styles.activeTab]}
            onPress={() => setActiveTab('crypto')}
          >
            <Text style={[styles.tabText, activeTab === 'crypto' && styles.activeTabText]}>Cripto ₿</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ height: 100, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <>
          <View style={styles.tickerContainer}>
            {renderTickers()}
          </View>
        </>
      )}

      {/* Crypto Highlights Grid (Only when Crypto Tab is active) */}
      {activeTab === 'crypto' && !loading && (
        <View style={styles.cryptoGrid}>
          <Text style={styles.sectionTitle}>Top Criptomoedas</Text>
          {cryptoData.map((crypto, index) => (
            <View key={index} style={styles.cryptoRow}>
              <View style={styles.cryptoInfo}>
                <View style={styles.cryptoIcon}>
                  <Text style={{ fontSize: 18 }}>🪙</Text>
                </View>
                <View>
                  <Text style={styles.cryptoName}>{crypto.name}</Text>
                  <Text style={styles.cryptoTicker}>{crypto.ticker || 'CRYPTO'}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cryptoPrice}>${crypto.price?.toLocaleString()}</Text>
                <Text style={[styles.cryptoChange, { color: crypto.change >= 0 ? colors.success : colors.danger }]}>
                  {crypto.change >= 0 ? '+' : ''}{formatPercent(crypto.changePercent)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}



      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 14,
  },
  compareShortcut: {
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 220, 130, 0.2)',
  },
  compareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  compareText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: colors.surfaceHighlight,
  },
  tabText: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.text,
    fontWeight: '700',
  },
  tickerContainer: {
    marginBottom: 24,
  },
  tickerContent: {
    paddingHorizontal: 24,
  },
  indexCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 140,
    height: 100,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  indexHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  indexName: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  indexChange: {
    fontSize: 12,
    fontWeight: '700',
  },
  indexValue: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '700',
  },

  // Crypto List
  cryptoGrid: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  cryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceHighlight,
  },
  cryptoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cryptoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cryptoName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  cryptoTicker: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cryptoPrice: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  cryptoChange: {
    fontSize: 14,
    fontWeight: '500',
  },


  promoContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 220, 130, 0.2)',
  },
  promoGradient: {
    padding: 16,
  },
  promoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  promoTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  promoSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  promoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
});

export default MarketScreen;
