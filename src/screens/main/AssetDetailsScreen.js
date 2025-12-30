import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  StatusBar,
  Platform
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from '../../components/common/Gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { usePortfolio } from '../../contexts/PortfolioContext';
import BrapiService from '../../services/brapiService';
import { fetchQuote, clearCache } from '../../services/marketService';
import NewsService from '../../services/newsService';
import AlphaVantageService from '../../services/alphaVantageService';
import AlertService from '../../services/alertService';
import StockAnalysisCard from '../../components/analysis/StockAnalysisCard';
import colors from '../../styles/colors';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const AssetDetailsScreen = ({ route, navigation }) => {
  // Formato unificado: sempre usar symbol como ticker principal, asset como objeto opcional
  const symbol = route.params?.symbol || route.params?.ticker;
  const asset = route.params?.asset || {};

  // Usar PortfolioContext para obter posição real do usuário
  const { portfolio } = usePortfolio();

  // Log unificado para rastrear navegação
  console.log(`[UNIFIED NAV] AssetDetailsScreen received:`, {
    symbol: symbol,
    asset: asset,
    routeParams: route.params
  });

  // Procurar posição no portfólio global, senão usar parâmetro passado
  const holding = portfolio?.find(p => p.ticker === symbol) || (asset.ticker ? asset : { ticker: symbol });

  // States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assetData, setAssetData] = useState(null);
  const [fundamentals, setFundamentals] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [news, setNews] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // UI Controls
  const [activeTab, setActiveTab] = useState('overview'); // overview, chart, news, analysis
  const [chartPeriod, setChartPeriod] = useState('1M'); // 1M, 3M, 6M, 1Y
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertType, setAlertType] = useState('above');

  // Helpers
  const safeToFixed = (value, decimals = 2) => {
    if (value === null) return 'Indisponível';
    if (value === undefined || value === '') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'Erro';
    return num.toFixed(decimals);
  };

  const isDataInvalid = (data) => {
    if (!data) return true;
    if (typeof data === 'object') {
      // Check for fundamentals object
      const keyFields = ['priceEarnings', 'returnOnEquity', 'dividendYield', 'priceToBook'];
      for (const field of keyFields) {
        const value = data[field];
        if (value === null || value === undefined || value === 'N/A' || value === 'Indisponível' || value === 'Erro') {
          return true;
        }
      }
      return false;
    } else {
      // Check for price
      return data === 0 || data === null || data === undefined || data === 'N/A' || data === 'Indisponível' || data === 'Erro';
    }
  };



  useEffect(() => {
    if (symbol) {
      loadAllData();
      loadAlerts();
    }
  }, [symbol]);

  const loadAllData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      await Promise.all([
        loadAssetData(forceRefresh),
        loadPriceHistory(chartPeriod),
        loadNews(),
        loadCompetitors() // Se BrapiService tiver suporte
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssetData = async (forceRefresh = false) => {
    try {
      // Usa marketService para suportar todos os tipos (Ações, Cripto, Stocks)
      const quoteData = await fetchQuote({ ticker: symbol, type: asset.type || 'Ação' }, forceRefresh);
      setAssetData(quoteData);

      // Fundamentals e Histórico dependem do tipo
      if (asset.type === 'Ação' || asset.type === 'FII' || !asset.type) {
        const fundData = await BrapiService.getFundamentals(symbol);
        setFundamentals(fundData);
      } else {
        // Para Cripto/Stocks, talvez não tenhamos fundamentos detalhados ainda
        setFundamentals(quoteData.fundamentals || null);
      }
    } catch (e) {
      console.warn('Erro ao carregar dados do ativo:', e);
      // Fallback visual
      if (!assetData) {
        setAssetData({
          price: asset.currentPrice || 0,
          symbol: symbol,
          changePercent: 0,
        });
      }
    }
  };

  const loadPriceHistory = async (period) => {
    try {
      if (asset.type === 'Ação' || asset.type === 'FII' || !asset.type) {
        const history = await BrapiService.getPriceHistory(symbol, period);
        setPriceHistory(history);
      } else {
        // TODO: Implementar histórico para Cripto/Stocks via AlphaVantage/CoinGecko
        // Por enquanto, retorna vazio para não quebrar
        console.log('Histórico não implementado para este tipo de ativo');
        setPriceHistory([]);
      }
    } catch (error) {
      console.warn(`Falha ao carregar histórico:`, error.message);
      setPriceHistory([]);
    }
  };

  const loadNews = async () => {
    try {
      // Try Alpha Vantage first for sentiment analysis
      const alphaVantageNews = await AlphaVantageService.getNewsSentiment(symbol, 10);
      if (alphaVantageNews && alphaVantageNews.length > 0) {
        setNews(alphaVantageNews);
        return;
      }

      // Fallback to NewsService if Alpha Vantage fails
      console.log('[AssetDetails] Alpha Vantage news failed, falling back to NewsService');
      const newsData = await NewsService.getAssetNews(symbol);
      setNews(newsData || []);
    } catch (e) {
      console.error('[AssetDetails] Error loading news:', e);
      setNews([]);
    }
  };

  const loadCompetitors = async () => {
    // Implementar se houver endpoint
    setCompetitors([]);
  };

  const loadAlerts = async () => {
    try {
      const userAlerts = await AlertService.getAlerts(symbol);
      setAlerts(userAlerts || []);
    } catch (e) {
      setAlerts([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData(true); // Force refresh on pull-to-refresh
    setRefreshing(false);
  };

  const handleCreateAlert = async () => {
    if (!alertPrice || isNaN(parseFloat(alertPrice))) {
      Alert.alert('Erro', 'Digite um preço válido');
      return;
    }

    const alert = {
      symbol,
      targetPrice: parseFloat(alertPrice),
      type: alertType,
      currentPrice: assetData?.price || 0,
      createdAt: new Date().toISOString()
    };

    await AlertService.createAlert(alert);
    await loadAlerts();
    setShowAlertModal(false);
    setAlertPrice('');
    Alert.alert('Sucesso', 'Alerta criado com sucesso!');
  };

  const handleDeleteAlert = async (alertId) => {
    Alert.alert('Confirmação', 'Excluir este alerta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          await AlertService.deleteAlert(alertId);
          await loadAlerts();
        }
      }
    ]);
  };

  // --- Renderers ---

  const renderMetricCard = (title, value, subtitle, color = colors.primary) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const getStatusColor = (metric, value) => {
    // Cores baseadas em análise fundamentalista simples
    if (metric === 'P/L') return value > 0 && value < 15 ? colors.success : value < 25 ? colors.warning : colors.danger;
    if (metric === 'ROE') return value > 15 ? colors.success : value > 5 ? colors.warning : colors.danger;
    if (metric === 'DY') return value > 6 ? colors.success : value > 3 ? colors.warning : colors.textMuted;
    return colors.info;
  };

  if (loading && !refreshing && !assetData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando análise...</Text>
      </View>
    );
  }

  // Adaptação para o StockAnalysisCard que espera valores em porcentagem (ex: 15.0) e não decimal (ex: 0.15)
  const fundamentalsForCard = fundamentals ? {
    ...fundamentals,
    returnOnEquity: fundamentals.returnOnEquity != null ? fundamentals.returnOnEquity * 100 : null,
    roe: fundamentals.roe != null ? fundamentals.roe * 100 : null,
    dividendYield: fundamentals.dividendYield != null ? fundamentals.dividendYield * 100 : null,
    dy: fundamentals.dy != null ? fundamentals.dy * 100 : null,
    profitMargin: fundamentals.profitMargin != null ? fundamentals.profitMargin * 100 : null,
    liquidMargin: fundamentals.liquidMargin != null ? fundamentals.liquidMargin * 100 : null,
    returnOnAssets: fundamentals.returnOnAssets != null ? fundamentals.returnOnAssets * 100 : null,
    roa: fundamentals.roa != null ? fundamentals.roa * 100 : null,
    revenueGrowth: fundamentals.revenueGrowth != null ? fundamentals.revenueGrowth * 100 : null,
  } : null;

  // Log para identificar problemas com ROE na tela de detalhes
  console.log(`[LOG ROE] AssetDetailsScreen - ${symbol}:`, {
    fundamentals_raw: fundamentals,
    fundamentalsForCard_roe: fundamentalsForCard?.returnOnEquity,
    fundamentalsForCard_roe_decimal: fundamentalsForCard?.roe,
    display_roe: fundamentalsForCard?.returnOnEquity ? `${fundamentalsForCard.returnOnEquity}%` : 'N/A'
  });

  const renderOverviewTab = () => (
    <>
      {/* Posição do Usuário (Se houver) */}
      {(holding && holding.quantity > 0) && (
        <LinearGradient
          colors={colors.cardGradient}
          style={styles.holdingFullCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.sectionTitle}>🏰 Sua Posição</Text>
          <View style={styles.holdingRow}>
            <View style={styles.holdingItem}>
              <Text style={styles.holdingLabel}>Qtd</Text>
              <Text style={styles.holdingValue}>{holding.quantity}</Text>
            </View>
            <View style={styles.holdingDivider} />
            <View style={styles.holdingItem}>
              <Text style={styles.holdingLabel}>Médio</Text>
              <Text style={styles.holdingValue}>{formatCurrency(holding.averagePrice)}</Text>
            </View>
            <View style={styles.holdingDivider} />
            <View style={styles.holdingItem}>
              <Text style={styles.holdingLabel}>Atual</Text>
              <Text style={styles.holdingValue}>{formatCurrency(holding.quantity * (assetData?.price || 0))}</Text>
            </View>
          </View>

          <View style={styles.holdingFooter}>
            <Text style={styles.holdingResultLabel}>Resultado:</Text>
            <Text style={[
              styles.holdingResultValue,
              { color: ((assetData?.price || 0) - holding.averagePrice) >= 0 ? colors.success : colors.danger }
            ]}>
              {formatCurrency((assetData?.price - holding.averagePrice) * holding.quantity)}
              {' '}
              ({formatPercent(((assetData?.price / holding.averagePrice) - 1) * 100)})
            </Text>
          </View>
        </LinearGradient>
      )}

      <StockAnalysisCard symbol={symbol} fundamentals={fundamentalsForCard} />

      {/* Alertas */}
      {alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🔔 Seus Alertas</Text>
          {alerts.map((alert, idx) => (
            <View key={idx} style={styles.alertItem}>
              <View>
                <Text style={styles.alertItemText}>
                  {alert.type === 'above' ? '▲ Acima de' : '▼ Abaixo de'} {formatCurrency(alert.targetPrice)}
                </Text>
                <Text style={styles.alertDate}>{new Date(alert.createdAt).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteAlert(alert.id)}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderChartTab = () => (
    <View style={styles.section}>
      <View style={styles.periodParams}>
        {['1M', '3M', '6M', '1Y', '5Y'].map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, chartPeriod === p && styles.periodBtnActive]}
            onPress={() => { setChartPeriod(p); loadPriceHistory(p); }}
          >
            <Text style={[styles.periodBtnText, chartPeriod === p && styles.periodBtnTextActive]}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {priceHistory.length > 0 ? (
        <View style={styles.chartWrapper}>
          <LineChart
            data={{
              labels: priceHistory.filter((_, i) => i % Math.ceil(priceHistory.length / 4) === 0).map(i => new Date(i.date).getDate() + '/' + (new Date(i.date).getMonth() + 1)),
              datasets: [{ data: priceHistory.map(i => i.price) }]
            }}
            width={width - 40}
            height={220}
            yAxisLabel="R$ "
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 220, 130, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary }
            }}
            bezier
            style={styles.chartStyle}
          />
        </View>
      ) : (
        <Text style={styles.emptyText}>Gráfico indisponível para este período.</Text>
      )}
    </View>
  );

  const renderNewsTab = () => (
    <View style={styles.section}>
      <Text style={styles.sectionHeader}>📰 Últimas Notícias</Text>
      {news.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma notícia encontrada.</Text>
      ) : (
        news.map((item, index) => (
          <TouchableOpacity key={index} style={styles.newsItem}>
            <Text style={styles.newsSource}>{item.source}</Text>
            <Text style={styles.newsTitle}>{item.title}</Text>
            <Text style={styles.newsDate}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  const renderFundamentalsTab = () => {
    // Calcular Preço Teto (Método Bazin simplificado: Dividend Yield de 6%)
    const dividendYield = fundamentals?.dividendYield || 0;
    const lastDividend = fundamentals?.lastDividend || 0;
    const precoTeto = dividendYield > 0 ? (lastDividend / 0.06) : null;

    // Margem de Segurança
    const currentPrice = assetData?.price || 0;
    const margemSeguranca = precoTeto ? ((precoTeto - currentPrice) / precoTeto) * 100 : null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>📊 Indicadores Fundamentalistas</Text>

        {/* Grid de Métricas */}
        <View style={styles.gridContainer}>
          {/* Preço Teto */}
          {renderMetricCard(
            'Preço Teto',
            precoTeto ? formatCurrency(precoTeto) : 'N/A',
            'Método Bazin (DY 6%)',
            colors.info
          )}

          {/* Margem de Segurança */}
          {renderMetricCard(
            'Margem de Segurança',
            margemSeguranca !== null ? `${safeToFixed(margemSeguranca, 1)}%` : 'N/A',
            margemSeguranca > 20 ? 'Excelente' : margemSeguranca > 10 ? 'Boa' : 'Baixa',
            margemSeguranca > 20 ? colors.success : margemSeguranca > 10 ? colors.warning : colors.danger
          )}

          {/* P/L */}
          {renderMetricCard(
            'P/L',
            fundamentals?.priceToEarnings ? safeToFixed(fundamentals.priceToEarnings, 2) : 'N/A',
            'Preço/Lucro',
            getStatusColor('P/L', fundamentals?.priceToEarnings || 0)
          )}

          {/* P/VP */}
          {renderMetricCard(
            'P/VP',
            fundamentals?.priceToBook ? safeToFixed(fundamentals.priceToBook, 2) : 'N/A',
            'Preço/Valor Patrimonial',
            fundamentals?.priceToBook < 1.5 ? colors.success : fundamentals?.priceToBook < 3 ? colors.warning : colors.danger
          )}

          {/* ROE */}
          {renderMetricCard(
            'ROE',
            fundamentals?.returnOnEquity ? `${safeToFixed(fundamentals.returnOnEquity * 100, 1)}%` : 'N/A',
            'Retorno sobre Patrimônio',
            getStatusColor('ROE', fundamentals?.returnOnEquity || 0)
          )}

          {/* Dividend Yield */}
          {renderMetricCard(
            'Dividend Yield',
            dividendYield ? `${safeToFixed(dividendYield * 100, 2)}%` : 'N/A',
            'Rendimento de Dividendos',
            getStatusColor('DY', dividendYield)
          )}

          {/* Margem Líquida */}
          {renderMetricCard(
            'Margem Líquida',
            fundamentals?.profitMargin ? `${safeToFixed(fundamentals.profitMargin * 100, 1)}%` : 'N/A',
            'Lucratividade',
            fundamentals?.profitMargin > 10 ? colors.success : fundamentals?.profitMargin > 5 ? colors.warning : colors.danger
          )}

          {/* EV/EBITDA */}
          {renderMetricCard(
            'EV/EBITDA',
            fundamentals?.evToEbitda ? safeToFixed(fundamentals.evToEbitda, 2) : 'N/A',
            'Valor da Empresa',
            fundamentals?.evToEbitda < 10 ? colors.success : fundamentals?.evToEbitda < 15 ? colors.warning : colors.danger
          )}

          {/* Dívida Líquida/EBITDA */}
          {renderMetricCard(
            'Dív. Líq./EBITDA',
            fundamentals?.debtToEbitda ? safeToFixed(fundamentals.debtToEbitda, 2) : 'N/A',
            'Endividamento',
            fundamentals?.debtToEbitda < 2 ? colors.success : fundamentals?.debtToEbitda < 3.5 ? colors.warning : colors.danger
          )}

          {/* ROA */}
          {renderMetricCard(
            'ROA',
            fundamentals?.returnOnAssets ? `${safeToFixed(fundamentals.returnOnAssets * 100, 1)}%` : 'N/A',
            'Retorno sobre Ativos',
            fundamentals?.returnOnAssets > 5 ? colors.success : fundamentals?.returnOnAssets > 2 ? colors.warning : colors.danger
          )}

          {/* PSR */}
          {renderMetricCard(
            'PSR',
            fundamentals?.priceToSales ? safeToFixed(fundamentals.priceToSales, 2) : 'N/A',
            'Preço/Receita',
            fundamentals?.priceToSales < 2 ? colors.success : fundamentals?.priceToSales < 4 ? colors.warning : colors.danger
          )}

          {/* Crescimento de Receita */}
          {renderMetricCard(
            'Cresc. Receita',
            fundamentals?.revenueGrowth ? `${safeToFixed(fundamentals.revenueGrowth * 100, 1)}%` : 'N/A',
            'Crescimento Anual',
            fundamentals?.revenueGrowth > 10 ? colors.success : fundamentals?.revenueGrowth > 0 ? colors.warning : colors.danger
          )}
        </View>

        {/* Legenda */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>💡 Legenda de Cores:</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Verde: Excelente</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.legendText}>Amarelo: Atenção</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Vermelho: Cuidado</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerSymbol}>{symbol}</Text>
          <Text style={styles.headerName}>
            {assetData?.name || asset.name || symbol}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowAlertModal(true)} style={styles.alertIcon}>
          <Ionicons name="notifications-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Preço de Destaque */}
      <View style={styles.priceHeader}>
        <Text style={styles.bigPrice}>{formatCurrency(assetData?.price || 0)}</Text>
        <View style={[styles.badge, { backgroundColor: (assetData?.changePercent || 0) >= 0 ? 'rgba(0, 220, 130, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
          <Ionicons name={(assetData?.changePercent || 0) >= 0 ? "arrow-up" : "arrow-down"} size={12} color={(assetData?.changePercent || 0) >= 0 ? colors.success : colors.danger} />
          <Text style={[styles.badgeText, { color: (assetData?.changePercent || 0) >= 0 ? colors.success : colors.danger }]}>
            {formatPercent(assetData?.changePercent || 0)}
          </Text>
        </View>
      </View>

      {/* Abas */}
      <View style={styles.tabsContainer}>
        {['overview', 'fundamentos', 'chart', 'news'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'overview' ? 'Visão Geral' : tab === 'fundamentos' ? 'Fundamentos' : tab === 'chart' ? 'Gráfico' : 'Notícias'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'fundamentos' && renderFundamentalsTab()}
        {activeTab === 'chart' && renderChartTab()}
        {activeTab === 'news' && renderNewsTab()}
      </ScrollView>

      {/* Modal de Alerta */}
      <Modal visible={showAlertModal} transparent animationType="fade" onRequestClose={() => setShowAlertModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Alerta</Text>
            <Text style={styles.modalSubtitle}>Defina um preço alvo para {symbol}</Text>

            <View style={styles.typeSelector}>
              <TouchableOpacity onPress={() => setAlertType('above')} style={[styles.typeBtn, alertType === 'above' && styles.typeBtnActive]}>
                <Text style={styles.typeBtnText}>Acima de</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setAlertType('below')} style={[styles.typeBtn, alertType === 'below' && styles.typeBtnActive]}>
                <Text style={styles.typeBtnText}>Abaixo de</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="R$ 0,00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={alertPrice}
              onChangeText={setAlertPrice}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowAlertModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreateAlert} style={styles.saveBtn}>
                <Text style={styles.saveText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerSymbol: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerName: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  backButton: {
    padding: 8,
  },
  alertIcon: {
    padding: 8,
  },
  priceHeader: {
    alignItems: 'center',
    marginVertical: 10,
  },
  bigPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 10,
  },
  tabItem: {
    marginRight: 24,
    paddingVertical: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  holdingFullCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ECFDF5',
    marginBottom: 12,
    opacity: 0.9,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  holdingItem: {
    alignItems: 'center',
    flex: 1,
  },
  holdingLabel: {
    fontSize: 12,
    color: '#A7F3D0',
    marginBottom: 4,
  },
  holdingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  holdingDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: '100%',
  },
  holdingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  holdingResultLabel: {
    color: '#ECFDF5',
    fontWeight: 'bold',
  },
  holdingResultValue: {
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2, // 20 pad left, 20 pad right, 20 gap
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  metricSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  periodParams: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 4,
    borderRadius: 8,
  },
  periodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
  },
  periodBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  periodBtnTextActive: {
    color: '#000',
  },
  chartWrapper: {
    alignItems: 'center',
    marginLeft: -20, // compensate for padding/margin shenanigans in chart kit
  },
  chartStyle: {
    borderRadius: 16,
  },
  newsItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newsSource: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  newsDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  alertItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertItemText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 14,
  },
  alertDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 24,
    textAlign: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  saveText: {
    color: '#000',
    fontWeight: 'bold',
  },
  bazinCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bazinRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  bazinItem: {
    flex: 1,
    alignItems: 'center',
  },
  bazinLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bazinValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  bazinDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.border,
  },
  marginSafetyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  marginSafetyLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  marginSafetyValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiButton: {
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  aiButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  legendContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default AssetDetailsScreen;