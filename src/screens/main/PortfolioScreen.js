import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import colors from '../../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from '../../components/common/Gradient';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { fetchQuote, fetchExchangeRate } from '../../services/marketService';
import { getFilteredPortfolioStats } from '../../domain/portfolio/filteredPortfolioStats';
import AssetCard from '../../components/common/AssetCard';
import PrivacyAwareText from '../../components/common/PrivacyAwareText';
import { generateAndSharePortfolioReport } from '../../services/reportService';

const { width } = Dimensions.get('window');

const PortfolioScreen = ({ navigation }) => {
  const { portfolio, loading: portfolioLoading, error: portfolioError, isPrivacyModeEnabled } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all'); // all, Ação, FII, Stock, REIT, ETF, Crypto
  const [sortBy, setSortBy] = useState('profit'); // profit, name, value
  const [refreshing, setRefreshing] = useState(false);
  const [realPrices, setRealPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(5.0);

  // 2. Renomear loading para evitar conflito e controlar estado local
  const [isFetchingPrices, setIsFetchingPrices] = useState(true);

  const loadRealData = async (showLoader = true) => {
    try {
      if (portfolio.length === 0) {
        setIsFetchingPrices(false);
        setRefreshing(false);
        return;
      }
      if (showLoader) setIsFetchingPrices(true);

      const rate = await fetchExchangeRate();
      setExchangeRate(rate);

      // 3. Buscar cotações para cada ativo no portfólio
      const pricesPromises = portfolio.map(asset => fetchQuote(asset));
      const results = await Promise.allSettled(pricesPromises);

      const pricesMap = results.reduce((acc, result, index) => {
        if (result.status === 'fulfilled') {
          acc[portfolio[index].ticker] = result.value;
        }
        return acc;
      }, {});

      setRealPrices(pricesMap);
    } catch (error) {
      console.error('❌ Load error:', error);
    } finally {
      setIsFetchingPrices(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 4. Chamar a busca de dados quando o portfólio do contexto for carregado
    if (!portfolioLoading) {
      loadRealData();
    }
  }, [portfolioLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRealData(false);
  };

  const assetsWithRealPrices = useMemo(() => {
    return portfolio.map((asset) => {
      const realPrice = realPrices[asset.ticker];
      const currentPrice = realPrice ? realPrice.price : asset.currentPrice;

      const priceInBRL = asset.currency === 'USD' ? (currentPrice || 0) * exchangeRate : currentPrice;
      // ✅ CORREÇÃO: Usar o `totalInvested` que já foi calculado pelo serviço de transações,
      // garantindo que o custo das vendas seja abatido corretamente.
      const invested = asset.totalInvested || 0;
      const current = priceInBRL * asset.quantity;
      const profit = current - invested;
      const profitPercent = invested !== 0 ? (profit / invested) * 100 : 0;

      return {
        ...asset,
        currentPriceReal: priceInBRL,
        invested,
        current,
        profit,
        profitPercent,
        isMock: realPrice?.isMock || false,
      };
    });
  }, [portfolio, realPrices, exchangeRate]);

  const filteredAssets = useMemo(() => {
    let filtered = assetsWithRealPrices;

    if (selectedType !== 'all') {
      filtered = filtered.filter((a) => a.type === selectedType);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) => a.ticker.toLowerCase().includes(query) || a.name.toLowerCase().includes(query)
      );
    }

    if (sortBy === 'profit') {
      filtered.sort((a, b) => b.profitPercent - a.profitPercent);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.ticker.localeCompare(b.ticker));
    } else if (sortBy === 'value') {
      filtered.sort((a, b) => b.current - a.current);
    }

    return filtered;
  }, [assetsWithRealPrices, selectedType, searchQuery, sortBy]);

  const stats = useMemo(() =>
    getFilteredPortfolioStats(filteredAssets, realPrices),
    [filteredAssets, realPrices]);

  if (portfolioLoading) { // 5. Usar o loading principal do contexto
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Carregando Portfólio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Portfólio</Text>
            <Text style={styles.subtitle}>{stats.count} ativos</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={() => navigation.navigate('AssetManagement')}
            >
              <Ionicons name="options-outline" size={18} color="#fff" />
              <Text style={styles.manageButtonText}>Gerenciar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isFetchingPrices && <ActivityIndicator style={{ marginVertical: 10 }} color={colors.primary} />}

        <LinearGradient
          colors={[colors.surface, '#0F172A']}
          style={styles.statsCard}
        >
          <View style={styles.statsMain}>
            <Text style={styles.statsMainLabel}>Patrimônio Total</Text>
            <PrivacyAwareText style={styles.statsMainValue}>{formatCurrency(stats.current)}</PrivacyAwareText>
            <View style={styles.statsProfitRow}>
              <Text style={[styles.statsProfitPercent, { color: stats.profit >= 0 ? colors.success : colors.danger }]}>
                {stats.profit >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(stats.profitPercent))}
              </Text>
              <Text style={styles.statsProfitValue}> ({formatCurrency(stats.profit)})</Text>
            </View>
          </View>

          <View style={styles.statsSecondary}>
            <View style={styles.statsSecItem}>
              <Text style={styles.statsSecLabel}>Investido</Text>
              <PrivacyAwareText style={styles.statsSecValue}>{formatCurrency(stats.invested)}</PrivacyAwareText>
            </View>
            <View style={styles.statsSecDivider} />
            <View style={styles.statsSecItem}>
              <Text style={styles.statsSecLabel}>Rentab. Geral</Text>
              <Text style={[styles.statsSecValue, { color: stats.profit >= 0 ? colors.success : colors.danger }]}>
                {formatPercent(stats.profitPercent)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por ticker ou nome..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersSection}>
          <Text style={styles.filterLabel}>Tipo:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'all' && styles.filterChipActive]}
              onPress={() => setSelectedType('all')}
            >
              <Text style={[styles.filterChipText, selectedType === 'all' && styles.filterChipTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'Ação' && styles.filterChipActive]}
              onPress={() => setSelectedType('Ação')}
            >
              <Text style={[styles.filterChipText, selectedType === 'Ação' && styles.filterChipTextActive]}>Ação</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'FII' && styles.filterChipActive]}
              onPress={() => setSelectedType('FII')}
            >
              <Text style={[styles.filterChipText, selectedType === 'FII' && styles.filterChipTextActive]}>FII</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'Stock' && styles.filterChipActive]}
              onPress={() => setSelectedType('Stock')}
            >
              <Text style={[styles.filterChipText, selectedType === 'Stock' && styles.filterChipTextActive]}>Ações EUA</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'REIT' && styles.filterChipActive]}
              onPress={() => setSelectedType('REIT')}
            >
              <Text style={[styles.filterChipText, selectedType === 'REIT' && styles.filterChipTextActive]}>REITs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'ETF' && styles.filterChipActive]}
              onPress={() => setSelectedType('ETF')}
            >
              <Text style={[styles.filterChipText, selectedType === 'ETF' && styles.filterChipTextActive]}>ETFs</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, selectedType === 'Crypto' && styles.filterChipActive]}
              onPress={() => setSelectedType('Crypto')}
            >
              <Text style={[styles.filterChipText, selectedType === 'Crypto' && styles.filterChipTextActive]}>
                Cripto
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Ordenar por:</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'profit' && styles.sortButtonActive]}
              onPress={() => setSortBy('profit')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'profit' && styles.sortButtonTextActive]}>
                Rentabilidade
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'value' && styles.sortButtonActive]}
              onPress={() => setSortBy('value')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'value' && styles.sortButtonTextActive]}>
                Valor
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
                ticker
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.assetsSection}>
          <Text style={styles.assetsSectionTitle}>
            {filteredAssets.length} {filteredAssets.length === 1 ? 'Ativo' : 'Ativos'}
          </Text>

          {filteredAssets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyStateText}>Nenhum ativo encontrado</Text>
              <Text style={styles.emptyStateSubtext}>Tente ajustar os filtros</Text>
            </View>
          ) : (
            filteredAssets.map((asset) => {
              const currentPrice = realPrices[asset.ticker]?.price || asset.currentPrice;
              const priceInBRL = asset.currency === 'USD' ? (currentPrice || 0) * exchangeRate : currentPrice;
              // A navegação foi movida para dentro do AssetCard, mas garantimos que ele receba os dados corretos.
              // A rota correta 'AssetDetails' já está sendo usada pelo AssetCard.
              // Nenhuma mudança é necessária aqui, pois o AssetCard já faz o trabalho certo.
              return (
                <AssetCard
                  key={asset.ticker}
                  asset={asset}
                  currentPrice={priceInBRL}
                  onPress={() => {
                    console.log(`[PORTFOLIO NAV] Navigating to AssetDetails for ${asset.ticker}:`, {
                      symbol: asset.ticker,
                      asset: asset,
                      currentPrice: priceInBRL
                    });
                    navigation.navigate('AssetDetails', {
                      symbol: asset.ticker,
                      asset: asset,
                    });
                  }}
                />
              );
            })
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.text },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  manageButton: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  manageButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '700', marginLeft: 6 },

  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statsMain: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  statsMainLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  statsMainValue: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: -1 },
  statsProfitRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statsProfitPercent: { fontSize: 14, fontWeight: '700' },
  statsProfitValue: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },

  statsSecondary: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between'
  },
  statsSecItem: { flex: 1, alignItems: 'center' },
  statsSecLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4, fontWeight: '700' },
  statsSecValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  statsSecDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', height: '70%', alignSelf: 'center' },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 46,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  searchIcon: { fontSize: 16, marginRight: 8, opacity: 0.6 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  clearIcon: { fontSize: 18, color: colors.textSecondary, padding: 4 },

  filtersSection: { marginBottom: 16, paddingLeft: 20 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  filterChipTextActive: { color: '#000' },

  sortSection: { marginHorizontal: 20, marginBottom: 20 },
  sortLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  sortButtons: { flexDirection: 'row', gap: 10 },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  sortButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortButtonText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  sortButtonTextActive: { color: '#000' },

  assetsSection: { paddingHorizontal: 20, marginTop: 12 },
  assetsSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyStateIcon: { fontSize: 48, marginBottom: 16 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: colors.textSecondary },

  assetCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetCardLeft: { flexDirection: 'row', flex: 1, marginRight: 12 },
  assetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetIconText: { fontSize: 24 },
  assetInfo: { flex: 1 },
  assetTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  assetTicker: { fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 6 },
  mockBadge: { fontSize: 12 },
  assetName: { fontSize: 13, color: colors.textSecondary, marginBottom: 2 },
  assetType: { fontSize: 11, color: colors.textSecondary },
  assetCardRight: { alignItems: 'flex-end' },
  assetValue: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  assetQuantity: { fontSize: 11, color: colors.textSecondary, marginBottom: 8 },
  assetProfitBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  assetProfitText: { fontSize: 12, fontWeight: '700' },
});

export default PortfolioScreen;
