/**
 * Componente que exibe gráfico de diversificação do portfolio
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

const DiversificationChart = ({ portfolio }) => {
  const data = useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return [];
    }

    const byType = portfolio.reduce((acc, asset) => {
      const value = asset.quantity * asset.currentPrice;
      const existing = acc.find(a => a.name === asset.type);
      if (existing) {
        existing.value += value;
        existing.count += 1;
      } else {
        acc.push({ name: asset.type, value, count: 1 });
      }
      return acc;
    }, []);

    const total = byType.reduce((sum, item) => sum + item.value, 0);

    return byType.map(item => ({
      ...item,
      percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0,
    }));
  }, [portfolio]);

  const COLORS = [colors.primary, colors.secondary];

  const getAnalysisMessage = () => {
    if (data.length === 0) return 'Sem dados';
    const maxPercent = Math.max(...data.map(d => parseFloat(d.percent)));
    if (maxPercent > 70) {
      return `⚠️ Portfolio muito concentrado em ${data[0]?.name} (${data[0]?.percent}%). Considere diversificar.`;
    }
    return `⭐ Portfolio bem diversificado entre ${data.length} tipo(s) de ativo.`;
  };

  if (!portfolio || portfolio.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🎯 Diversificação do Portfolio</Text>
        <Text style={styles.emptyText}>Nenhum ativo no portfolio</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Diversificação do Portfolio</Text>

      <View style={styles.chartContainer}>
        {/* Gráfico de pizza simples usando barras horizontais */}
        <View style={styles.piePlaceholder}>
          {data.map((item, index) => (
            <View key={index} style={styles.pieSegment}>
              <View
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: COLORS[index % COLORS.length],
                    width: `${item.percent}%`,
                  },
                ]}
              />
              <Text style={styles.pieLabel}>
                {item.name}: {item.percent}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.dot, { backgroundColor: COLORS[index % COLORS.length] }]}
            />
            <View style={styles.legendContent}>
              <Text style={styles.legendLabel}>{item.name}</Text>
              <Text style={styles.legendValue}>
                {item.percent}% ({item.count} ativo{item.count > 1 ? 's' : ''})
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Análise */}
      <View style={styles.analysis}>
        <Text style={styles.analysisText}>
          {getAnalysisMessage()}
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
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  piePlaceholder: {
    width: width - 80,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pieSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  pieSlice: {
    height: 20,
    borderRadius: 10,
  },
  pieLabel: {
    marginLeft: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendContent: {
    flex: 1,
  },
  legendLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendValue: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  analysis: {
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  analysisText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default DiversificationChart;
