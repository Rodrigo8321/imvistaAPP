/**
 * Componente que exibe ranking de performance dos ativos
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

const PerformanceComparison = ({ portfolio }) => {
  const ranking = useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return [];
    }

    return [...portfolio]
      .map(asset => ({
        ticker: asset.ticker,
        name: asset.name,
        performance: ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100,
        profit: (asset.currentPrice - asset.avgPrice) * asset.quantity,
        type: asset.type,
      }))
      .sort((a, b) => b.performance - a.performance);
  }, [portfolio]);

  const topPerformers = ranking.slice(0, 3);
  const bottomPerformers = ranking.slice(-3).reverse();

  const avgPerformance = ranking.length > 0
    ? ranking.reduce((sum, a) => sum + a.performance, 0) / ranking.length
    : 0;

  const PerformanceItem = ({ asset, index, isTop = true }) => {
    const isPositive = asset.performance >= 0;
    const color = isPositive ? colors.success : colors.danger;
    const medal = isTop
      ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉')
      : '📉';

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <View style={styles.rank}>
            <Text style={styles.rankText}>{medal}</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.ticker}>{asset.ticker}</Text>
            <Text style={styles.name}>{asset.name}</Text>
          </View>
          <View style={styles.itemStats}>
            <Text style={[styles.performance, { color }]}>
              {isPositive ? '▲' : '▼'} {Math.abs(asset.performance).toFixed(2)}%
            </Text>
          </View>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(Math.abs(asset.performance), 100)}%`,
                backgroundColor: color,
              },
            ]}
          />
        </View>
      </View>
    );
  };

  if (ranking.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🏆 Ranking de Performance</Text>
        <Text style={styles.emptyText}>Nenhum ativo no portfolio</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Ranking de Performance</Text>

      {/* Top Performers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 3 Melhores</Text>
        {topPerformers.map((asset, index) => (
          <PerformanceItem
            key={index}
            asset={asset}
            index={index}
            isTop={true}
          />
        ))}
      </View>

      {/* Bottom Performers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top 3 Piores</Text>
        {bottomPerformers.map((asset, index) => (
          <PerformanceItem
            key={index}
            asset={asset}
            index={index}
            isTop={false}
          />
        ))}
      </View>

      {/* Média do Portfolio */}
      <View style={styles.averageBox}>
        <Text style={styles.averageLabel}>Performance Média do Portfolio</Text>
        <Text style={[styles.averageValue, {
          color: avgPerformance >= 0 ? colors.success : colors.danger
        }]}>
          {avgPerformance >= 0 ? '+' : ''}{avgPerformance.toFixed(2)}%
        </Text>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  item: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rank: {
    marginRight: 12,
  },
  rankText: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  ticker: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  itemStats: {
    alignItems: 'flex-end',
  },
  performance: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  averageBox: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  averageLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  averageValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default PerformanceComparison;
