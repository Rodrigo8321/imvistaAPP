import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import PriceChart from '../../components/common/PriceChart';
import FundamentalsCard from '../../components/common/FundamentalsCard';

/**
 * Tela de detalhes de um ativo
 * @param {object} route - Objeto de rota com parâmetros
 * @param {object} navigation - Objeto de navegação
 */
const AssetDetailScreen = ({ route, navigation }) => {
  const { asset } = route.params;
  const [chartPeriod, setChartPeriod] = useState(30);
  const [loading, setLoading] = useState(false);

  // Calcular dados do ativo
  const assetData = useMemo(() => {
    const invested = asset.quantity * asset.avgPrice;
    const current = asset.quantity * asset.currentPrice;
    const profit = current - invested;
    const profitPercent = (profit / invested) * 100;
    const isPositive = profit >= 0;

    return {
      invested,
      current,
      profit,
      profitPercent,
      isPositive,
    };
  }, [asset]);

  // Simular ação de compra
  const handleBuy = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('✅ Sucesso', `Compra de ${asset.ticker} simulada!\n\nFuncionalidade em desenvolvimento`, [
        { text: 'OK' }
      ]);
    }, 1000);
  };

  // Simular ação de venda
  const handleSell = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('✅ Sucesso', `Venda de ${asset.ticker} simulada!\n\nFuncionalidade em desenvolvimento`, [
        { text: 'OK' }
      ]);
    }, 1000);
  };

  // Adicionar à watchlist
  const handleAddToWatchlist = () => {
    Alert.alert('💫 Em breve', 'Funcionalidade de Watchlist será adicionada em breve', [
      { text: 'OK' }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Voltar</Text>
          </TouchableOpacity>
        </View>

        {/* Ativo Info */}
        <View style={styles.assetInfo}>
          <View style={styles.assetHeader}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>
                {asset.type === 'Ação' ? '📈' : '🏢'}
              </Text>
            </View>
            <View style={styles.assetDetails}>
              <Text style={styles.ticker}>{asset.ticker}</Text>
              <Text style={styles.name}>{asset.name}</Text>
              <Text style={styles.sector}>{asset.sector}</Text>
            </View>
          </View>

          {/* Preços */}
          <View style={styles.pricesContainer}>
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Preço Médio</Text>
              <Text style={styles.price}>{formatCurrency(asset.avgPrice)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Preço Atual</Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                {formatCurrency(asset.currentPrice)}
              </Text>
            </View>
          </View>

          {/* Quantidade */}
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantidade em Portfólio</Text>
            <Text style={styles.quantity}>{asset.quantity} unidades</Text>
          </View>
        </View>

        {/* Resumo de Lucro/Prejuízo */}
        <View style={[styles.summaryCard, {
          backgroundColor: assetData.isPositive ? colors.success + '15' : colors.danger + '15',
          borderColor: assetData.isPositive ? colors.success : colors.danger,
        }]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Investido</Text>
              <Text style={styles.summaryValue}>{formatCurrency(assetData.invested)}</Text>
            </View>
            <View style={styles.summarySeparator} />
            <View>
              <Text style={styles.summaryLabel}>Valor Atual</Text>
              <Text style={styles.summaryValue}>{formatCurrency(assetData.current)}</Text>
            </View>
          </View>
          
          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Lucro/Prejuízo</Text>
              <Text style={[styles.summaryValue, {
                color: assetData.isPositive ? colors.success : colors.danger
              }]}>
                {formatCurrency(Math.abs(assetData.profit))}
              </Text>
            </View>
            <View style={styles.summarySeparator} />
            <View>
              <Text style={styles.summaryLabel}>Percentual</Text>
              <Text style={[styles.summaryValue, {
                color: assetData.isPositive ? colors.success : colors.danger
              }]}>
                {assetData.isPositive ? '▲' : '▼'} {Math.abs(assetData.profitPercent).toFixed(2)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Gráfico */}
        <PriceChart asset={asset} period={chartPeriod} />

        {/* Seletor de Período */}
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 7 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(7)}
          >
            <Text style={[styles.periodText, chartPeriod === 7 && styles.periodTextActive]}>
              7D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 30 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(30)}
          >
            <Text style={[styles.periodText, chartPeriod === 30 && styles.periodTextActive]}>
              30D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 90 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(90)}
          >
            <Text style={[styles.periodText, chartPeriod === 90 && styles.periodTextActive]}>
              90D
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.periodButton, chartPeriod === 365 && styles.periodButtonActive]}
            onPress={() => setChartPeriod(365)}
          >
            <Text style={[styles.periodText, chartPeriod === 365 && styles.periodTextActive]}>
              1A
            </Text>
          </TouchableOpacity>
        </View>

        {/* Fundamentals */}
        <FundamentalsCard asset={asset} type={asset.type} />

        {/* Botões de Ação */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.buyButton]}
            onPress={handleBuy}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>💰</Text>
                <Text style={styles.actionButtonText}>Comprar</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.sellButton]}
            onPress={handleSell}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionButtonIcon}>💸</Text>
                <Text style={styles.actionButtonText}>Vender</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.watchlistButton]}
            onPress={handleAddToWatchlist}
            disabled={loading}
          >
            <Text style={styles.actionButtonIcon}>⭐</Text>
            <Text style={styles.actionButtonText}>Favoritar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  assetInfo: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  assetDetails: {
    flex: 1,
  },
  ticker: {
    color: colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    marginBottom: 4,
  },
  sector: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pricesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  priceBox: {
    flex: 1,
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  priceDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  quantityContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  quantityLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  quantity: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  summarySeparator: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  periodTextActive: {
    color: colors.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButton: {
    backgroundColor: colors.success,
  },
  sellButton: {
    backgroundColor: colors.danger,
  },
  watchlistButton: {
    backgroundColor: colors.secondary,
  },
  actionButtonIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default AssetDetailScreen;
