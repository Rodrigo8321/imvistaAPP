/**
 * Componente que exibe distribuição por setor
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';

const SectorDistribution = ({ portfolio }) => {
  const sectorData = useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return [];
    }

    const bySector = portfolio.reduce((acc, asset) => {
      const value = asset.quantity * asset.currentPrice;
      const existing = acc.find(s => s.sector === asset.sector);
      if (existing) {
        existing.value += value;
        existing.count += 1;
        existing.assets.push(asset.ticker);
      } else {
        acc.push({
          sector: asset.sector,
          value,
          count: 1,
          assets: [asset.ticker],
        });
      }
      return acc;
    }, []);

    const total = bySector.reduce((sum, item) => sum + item.value, 0);

    return bySector
      .map(item => ({
        ...item,
        percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const SECTOR_ICONS = {
    'Petróleo': '⛽',
    'Mineração': '⛏️',
    'Financeiro': '🏦',
    'Tijolo': '🏢',
    'Logística': '📦',
  };

  const SECTOR_COLORS = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.danger,
  ];

  const SectorBox = ({ sector, index }) => (
    <View key={index} style={styles.sectorBox}>
      {/* Header */}
      <View style={styles.sectorHeader}>
        <View style={styles.sectorIcon}>
          <Text style={styles.icon}>
            {SECTOR_ICONS[sector.sector] || '📊'}
          </Text>
        </View>
        <View style={styles.sectorInfo}>
          <Text style={styles.sectorName}>{sector.sector}</Text>
          <Text style={styles.sectorAssets}>
            {sector.count} ativo{sector.count > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.sectorStats}>
          <Text style={styles.percent}>{sector.percent}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${sector.percent}%`,
                backgroundColor: SECTOR_COLORS[index % SECTOR_COLORS.length],
              },
            ]}
          />
        </View>
      </View>

      {/* Value */}
      <View style={styles.sectorValue}>
        <Text style={styles.valueLabel}>Valor Total</Text>
        <Text style={styles.valueText}>{formatCurrency(sector.value)}</Text>
      </View>

      {/* Assets List */}
      <View style={styles.assetsList}>
        {sector.assets.map((ticker, i) => (
          <Text key={i} style={styles.assetTag}>
            {ticker}
          </Text>
        ))}
      </View>
    </View>
  );

  if (!portfolio || portfolio.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🌐 Distribuição por Setor</Text>
        <Text style={styles.emptyText}>Nenhum ativo no portfolio</Text>
      </View>
    );
  }

  const getRecommendationText = () => {
    if (sectorData.length === 0) return '';
    const maxPercent = parseFloat(sectorData[0]?.percent || 0);
    if (maxPercent > 50) {
      return `Muito concentrado em ${sectorData[0]?.sector} (${sectorData[0]?.percent}%). Diversifique!`;
    }
    return `Portfolio diversificado entre ${sectorData.length} setor(es). Bom!`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌐 Distribuição por Setor</Text>

      <View style={styles.sectorsContainer}>
        {sectorData.map((sector, index) => (
          <SectorBox key={index} sector={sector} index={index} />
        ))}
      </View>

      {/* Recomendação */}
      <View style={styles.recommendation}>
        <Text style={styles.recIcon}>💡</Text>
        <View style={styles.recContent}>
          <Text style={styles.recTitle}>Concentração por Setor</Text>
          <Text style={styles.recText}>
            {getRecommendationText()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  sectorsContainer: {
    marginBottom: 16,
  },
  sectorBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  sectorInfo: {
    flex: 1,
  },
  sectorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sectorAssets: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  sectorStats: {
    alignItems: 'flex-end',
  },
  percent: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectorValue: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  valueLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  valueText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assetTag: {
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  recommendation: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  recIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recContent: {
    flex: 1,
  },
  recTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default SectorDistribution;
