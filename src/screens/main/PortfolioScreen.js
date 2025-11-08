import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { mockPortfolio } from '../../data/mockAssets';
import AssetCard from '../../components/common/AssetCard';

const PortfolioScreen = () => {
  const [portfolio] = useState(mockPortfolio);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, Ação, FII
  const [sortBy, setSortBy] = useState('ticker'); // ticker, performance, value

  // Filtrar e ordenar
  const filteredPortfolio = useMemo(() => {
    let filtered = portfolio;

    // Filtro de busca
    if (searchQuery) {
      filtered = filtered.filter(
        asset =>
          asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro de tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    // Ordenação
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'ticker':
          return a.ticker.localeCompare(b.ticker);
        case 'performance':
          const perfA = ((a.currentPrice - a.avgPrice) / a.avgPrice) * 100;
          const perfB = ((b.currentPrice - b.avgPrice) / b.avgPrice) * 100;
          return perfB - perfA;
        case 'value':
          const valueA = a.quantity * a.currentPrice;
          const valueB = b.quantity * b.currentPrice;
          return valueB - valueA;
        default:
          return 0;
      }
    });

    return sorted;
  }, [portfolio, searchQuery, filterType, sortBy]);

  // Calcular totais
  const totals = useMemo(() => {
    const invested = portfolio.reduce(
      (sum, asset) => sum + asset.quantity * asset.avgPrice,
      0
    );
    const current = portfolio.reduce(
      (sum, asset) => sum + asset.quantity * asset.currentPrice,
      0
    );
    const profit = current - invested;
    const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;

    return { invested, current, profit, profitPercent };
  }, [portfolio]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>💼 Meu Portfólio</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Em breve', 'Adicionar ativo')}
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryContainer}
        contentContainerStyle={styles.summaryContent}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>Total Investido</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(totals.invested)}
          </Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.secondary }]}>
          <Text style={styles.summaryLabel}>Valor Atual</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(totals.current)}
          </Text>
        </View>

        <View style={[styles.summaryCard, {
          backgroundColor: totals.profit >= 0 ? colors.success : colors.danger
        }]}>
          <Text style={styles.summaryLabel}>Lucro/Prejuízo</Text>
          <Text style={styles.summaryValue}>
            {formatCurrency(Math.abs(totals.profit))}
          </Text>
          <Text style={styles.summaryPercent}>
            {totals.profitPercent >= 0 ? '+' : ''}{totals.profitPercent.toFixed(2)}%
          </Text>
        </View>
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.controlsContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ativo..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'Ação' && styles.filterChipActive]}
            onPress={() => setFilterType('Ação')}
          >
            <Text style={[styles.filterText, filterType === 'Ação' && styles.filterTextActive]}>
              Ações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'FII' && styles.filterChipActive]}
            onPress={() => setFilterType('FII')}
          >
            <Text style={[styles.filterText, filterType === 'FII' && styles.filterTextActive]}>
              FIIs
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sort */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Ordenar:</Text>

          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'ticker' && styles.sortChipActive]}
            onPress={() => setSortBy('ticker')}
          >
            <Text style={[styles.sortText, sortBy === 'ticker' && styles.sortTextActive]}>
              A-Z
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'performance' && styles.sortChipActive]}
            onPress={() => setSortBy('performance')}
          >
            <Text style={[styles.sortText, sortBy === 'performance' && styles.sortTextActive]}>
              Performance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'value' && styles.sortChipActive]}
            onPress={() => setSortBy('value')}
          >
            <Text style={[styles.sortText, sortBy === 'value' && styles.sortTextActive]}>
              Valor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Asset List */}
        <View style={styles.listContainer}>
          {filteredPortfolio.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📊</Text>
              <Text style={styles.emptyTitle}>Nenhum ativo encontrado</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Tente outra busca' : 'Adicione seu primeiro ativo'}
              </Text>
            </View>
          ) : (
            filteredPortfolio.map(asset => {
              const invested = asset.quantity * asset.avgPrice;
              const current = asset.quantity * asset.currentPrice;
              const profit = current - invested;

              return (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onPress={() => {
                    Alert.alert(
                      asset.ticker,
                      `${asset.name}\n\n` +
                      `Quantidade: ${asset.quantity}\n` +
                      `Preço Médio: ${formatCurrency(asset.avgPrice)}\n` +
                      `Preço Atual: ${formatCurrency(asset.currentPrice)}\n\n` +
                      `Investido: ${formatCurrency(invested)}\n` +
                      `Valor Atual: ${formatCurrency(current)}\n` +
                      `Lucro: ${formatCurrency(profit)}`
                    );
                  }}
                />
              );
            })
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  summaryContainer: {
    paddingLeft: 20,
    marginVertical: 20,
  },
  summaryContent: {
    paddingRight: 20,
  },
  summaryCard: {
    width: 150,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
  },
  summaryLabel: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryPercent: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  filtersRow: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginRight: 8,
  },
  sortChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortChipActive: {
    backgroundColor: colors.border,
  },
  sortText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sortTextActive: {
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default PortfolioScreen;
