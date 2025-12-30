import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import LinearGradient from '../../components/common/Gradient';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../styles/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { fetchQuote, fetchExchangeRate } from '../../services/marketService';
import { calculateAssetsWithRealPrices, calculateCategoryAllocations, calculatePerformersBySegment } from '../../domain/portfolio/performanceCalculations';
import { getPortfolioStats } from '../../domain/portfolio/portfolioStats';
import PrivacyAwareText from '../../components/common/PrivacyAwareText';
import PortfolioChart from '../../components/charts/PortfolioChart';

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickActionBtn} onPress={onPress}>
    <View style={styles.quickActionIconContainer}>
      <Text style={{ fontSize: 24 }}>{icon}</Text>
    </View>
    <Text style={styles.quickActionLabel}>{label}</Text>
  </TouchableOpacity>
);



const FinancialGoal = ({ current, target }) => {
  const percent = Math.min((current / target) * 100, 100);
  return (
    <View style={styles.goalCard}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>Meta de Patrimônio</Text>
        <Text style={styles.goalTarget}>Alvo: {formatCurrency(target)}</Text>
      </View>
      <View style={styles.goalProgressContainer}>
        <LinearGradient
          colors={[colors.primary, '#00A86B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.goalProgressFill, { width: `${percent}%` }]}
        />
      </View>
      <View style={styles.goalFooter}>
        <Text style={styles.goalPercent}>{formatPercent(percent)}</Text>
        <Text style={styles.goalRemaining}>Faltam {formatCurrency(Math.max(target - current, 0))}</Text>
      </View>
    </View>
  );
};

const DashboardScreen = ({ navigation }) => {
  const { portfolio, loading: portfolioLoading, isPrivacyModeEnabled, togglePrivacyMode } = usePortfolio();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realPrices, setRealPrices] = useState({});
  const [exchangeRate, setExchangeRate] = useState(5.0);
  const [btcPrice, setBtcPrice] = useState(null);

  const loadRealData = async (showLoader = true) => {
    if (!portfolio || portfolio.length === 0) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (showLoader) setLoading(true);

    try {
      const rate = await fetchExchangeRate();
      setExchangeRate(rate);

      // Buscar Bitcoin
      try {
        const btcData = await fetchQuote({ ticker: 'BTC', type: 'Crypto' });
        setBtcPrice(btcData.price);
      } catch (btcError) {
        console.error('Erro ao buscar BTC:', btcError);
      }

      const pricesPromises = portfolio.map(asset => fetchQuote(asset));
      const results = await Promise.allSettled(pricesPromises);

      const pricesMap = results.reduce((acc, result, index) => {
        if (result.status === 'fulfilled') {
          acc[portfolio[index].ticker] = result.value;
        }
        return acc;
      }, {});

      setRealPrices(pricesMap);
    } catch (e) {
      console.error("Erro ao carregar dados reais", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const assetsWithRealPrices = useMemo(() => {
    return calculateAssetsWithRealPrices(portfolio, realPrices, exchangeRate);
  }, [portfolio, realPrices, exchangeRate]);

  const performersBySegment = useMemo(() => {
    return calculatePerformersBySegment(assetsWithRealPrices);
  }, [assetsWithRealPrices]);

  useEffect(() => {
    if (!portfolioLoading) loadRealData();
  }, [portfolioLoading]);

  const stats = useMemo(() => {
    const calculatedStats = getPortfolioStats({ portfolio, realPrices, exchangeRate });
    console.log('📊 Dashboard Stats:', JSON.stringify(calculatedStats, null, 2));
    return calculatedStats;
  }, [portfolio, realPrices, exchangeRate]);

  const categoryAllocations = useMemo(() => {
    return calculateCategoryAllocations(portfolio, realPrices, exchangeRate);
  }, [portfolio, realPrices, exchangeRate]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRealData(false);
  };

  const handleManualRefresh = () => {
    onRefresh();
    Alert.alert('Atualizado', 'Os dados do portfólio foram atualizados.');
  };

  if (loading || portfolioLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>Sincronizando Portfólio...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Investidor</Text>
            <Text style={styles.date}>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
            <TouchableOpacity style={styles.usdBadge}>
              <Text style={styles.usdText}>🇺🇸 USD {formatCurrency(exchangeRate)}</Text>
            </TouchableOpacity>
            {btcPrice && (
              <TouchableOpacity style={styles.btcBadge}>
                <Text style={styles.btcText}>₿ BTC ${btcPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={togglePrivacyMode} style={styles.iconButton}>
              <Text style={{ color: colors.primary, fontSize: 18 }}>{isPrivacyModeEnabled ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleManualRefresh} style={styles.iconButton}>
              <Text style={{ color: colors.primary }}>🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
              <Ionicons name="settings-sharp" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO CARD PATRIMONIO */}
        <LinearGradient
          colors={colors.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroLabel}>Patrimônio Total</Text>
          <PrivacyAwareText style={styles.heroValue}>{formatCurrency(stats.totalCurrent)}</PrivacyAwareText>
          <View style={styles.heroDailyRow}>
            <Ionicons
              name={stats.dailyProfitBRL >= 0 ? "trending-up" : "trending-down"}
              size={12}
              color={stats.dailyProfitBRL >= 0 ? colors.success : colors.danger}
            />
            <Text style={[styles.heroDailyText, { color: stats.dailyProfitBRL >= 0 ? colors.success : colors.danger }]}>
              {stats.dailyProfitBRL >= 0 ? '+' : ''}{formatCurrency(stats.dailyProfitBRL)} hoje
            </Text>
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Rentabilidade</Text>
              <PrivacyAwareText style={[styles.heroStatValue, { color: stats.profit >= 0 ? colors.success : colors.danger }]}>
                {stats.profit >= 0 ? '+' : ''}{formatCurrency(stats.profit)} ({formatPercent(stats.profitPercent)})
              </PrivacyAwareText>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatLabel}>Investido</Text>
              <PrivacyAwareText style={styles.heroStatValue}>{formatCurrency(stats.totalInvested)}</PrivacyAwareText>
            </View>
          </View>
        </LinearGradient>



        <View style={styles.quickActionsContainer}>
          <QuickAction icon="💰" label="Novo Ativo" onPress={() => navigation.navigate('AssetManagement', { openModal: true })} />
          <QuickAction icon="📊" label="Proventos" onPress={() => navigation.navigate('Dividends')} />
          <QuickAction icon="🌐" label="Mercado" onPress={() => navigation.navigate('Market')} />
          <QuickAction icon="📝" label="Gestão" onPress={() => navigation.navigate('AssetManagement')} />
        </View>

        {/* SAÚDE DA CARTEIRA */}
        <View style={styles.healthContainer}>
          <View style={styles.healthInfo}>
            <Text style={styles.healthLabel}>Saúde da Carteira</Text>
            <Text style={styles.healthValue}>
              {portfolio.length > 8 ? 'Excelente' : portfolio.length > 4 ? 'Boa' : 'Em Construção'}
            </Text>
            <View style={styles.healthScoreBar}>
              <View style={[styles.healthScoreFill, { width: `${Math.min(portfolio.length * 10, 100)}%` }]} />
            </View>
          </View>
          <Ionicons
            name={portfolio.length > 5 ? "shield-checkmark-outline" : "shield-outline"}
            size={32}
            color={portfolio.length > 5 ? colors.success : colors.warning}
          />
        </View>

        {/* META FINANCEIRA */}
        <FinancialGoal current={stats.totalCurrent} target={100000} />

        {/* ALOCAÇÃO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sua Alocação</Text>
          <View style={styles.allocationBarContainer}>
            {categoryAllocations.map((cat, index) => (
              <View
                key={cat.type}
                style={{
                  flex: cat.percentage,
                  backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.danger][index % 4],
                  height: 8,
                  marginRight: 2,
                  borderRadius: 4
                }}
              />
            ))}
          </View>
          <View style={styles.allocationLegend}>
            {categoryAllocations.map((cat, index) => (
              <View key={cat.type} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.danger][index % 4] }]} />
                <Text style={styles.legendText}>{cat.label} {formatPercent(cat.percentage)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* DESTAQUES (Alinhar estilo com Mercado) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destaques do Dia</Text>
          {Object.values(performersBySegment).some(s => s.top.length > 0) ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginLeft: -20, paddingLeft: 20 }}>
              {Object.entries(performersBySegment).map(([key, segment]) =>
                segment.top.map(asset => (
                  <View key={asset.ticker} style={styles.highlightCard}>
                    <Text style={styles.highlightTicker}>{asset.ticker}</Text>
                    <Text style={styles.highlightValue}>{formatCurrency(asset.currentPrice)}</Text>
                    <Text style={styles.highlightChange}>+{formatPercent(asset.dailyChange)}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          ) : (
            <Text style={{ color: colors.textSecondary }}>Mercado fechado ou sem dados.</Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  date: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  usdBadge: {
    marginTop: 8,
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  usdText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  btcBadge: {
    marginTop: 4,
    backgroundColor: '#F7931A20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#F7931A40',
  },
  btcText: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: '700',
  },
  iconButton: {
    backgroundColor: colors.surfaceHighlight,
    padding: 10,
    borderRadius: 12,
  },

  // HERO CARD
  heroCard: {
    // backgroundColor: colors.surface, // Removido para usar Gradient
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    // borderWidth: 1, // Removido border para gradient mais limpo
    // borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // Aumentado ligeiramente
    shadowRadius: 16,
    elevation: 8,
  },
  heroLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '600',
  },
  heroValue: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -1,
  },
  heroDailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroDailyText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)', // Cor mais suave para overlay no gradient
  },
  heroStat: {
    flex: 1,
  },
  heroStatLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  heroStatValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },

  // QUICK ACTIONS
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  quickActionBtn: {
    alignItems: 'center',
    width: '22%',
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  quickActionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },

  // SECTIONS
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  allocationBarContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 16,
    overflow: 'hidden',
  },
  allocationLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  // HIGHLIGHTS
  highlightCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  highlightTicker: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
  },
  highlightValue: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  highlightChange: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },

  healthContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  healthInfo: {
    flex: 1,
    paddingRight: 16,
  },
  healthLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  healthValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  healthScoreBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthScoreFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  goalCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalTarget: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  goalProgressContainer: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  goalProgressFill: {
    height: '100%',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalPercent: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalRemaining: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

export default DashboardScreen;
