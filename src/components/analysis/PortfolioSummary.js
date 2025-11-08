/**
 * Componente que exibe resumo geral do portfolio
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';

const PortfolioSummary = ({ portfolio }) => {
  const stats = useMemo(() => {
    if (!portfolio || portfolio.length === 0) {
      return {
        totalInvested: 0,
        totalCurrent: 0,
        totalProfit: 0,
        profitPercent: 0,
        stocks: 0,
        fiis: 0,
        totalAssets: 0,
      };
    }

    const totalInvested = portfolio.reduce(
      (sum, asset) => sum + (asset.quantity * asset.avgPrice),
      0
    );
    const totalCurrent = portfolio.reduce(
      (sum, asset) => sum + (asset.quantity * asset.currentPrice),
      0
    );
    const totalProfit = totalCurrent - totalInvested;
    const profitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const stocks = portfolio.filter(a => a.type === 'Ação').length;
    const fiis = portfolio.filter(a => a.type === 'FII').length;

    return {
      totalInvested,
      totalCurrent,
      totalProfit,
      profitPercent,
      stocks,
      fiis,
      totalAssets: portfolio.length,
    };
  }, [portfolio]);

  const isPositive = stats.totalProfit >= 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📈 Resumo Geral do Portfolio</Text>

      {/* Primeira Linha */}
      <View style={styles.row}>
        <View style={[styles.box, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}>
          <Text style={styles.label}>Total Investido</Text>
          <Text style={styles.value}>{formatCurrency(stats.totalInvested)}</Text>
        </View>

        <View style={[styles.box, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary }]}>
          <Text style={styles.label}>Valor Atual</Text>
          <Text style={styles.value}>{formatCurrency(stats.totalCurrent)}</Text>
        </View>
      </View>

      {/* Segunda Linha */}
      <View style={styles.row}>
        <View style={[
          styles.box,
          {
            backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20',
            borderColor: isPositive ? colors.success : colors.danger,
          }
        ]}>
          <Text style={styles.label}>Lucro/Prejuízo</Text>
          <Text style={[styles.value, {
            color: isPositive ? colors.success : colors.danger
          }]}>
            {formatCurrency(Math.abs(stats.totalProfit))}
          </Text>
          <Text style={[styles.percent, {
            color: isPositive ? colors.success : colors.danger
          }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(stats.profitPercent).toFixed(2)}%
          </Text>
        </View>

        <View style={[styles.box, { backgroundColor: colors.border + '40', borderColor: colors.border }]}>
          <Text style={styles.label}>Total de Ativos</Text>
          <Text style={styles.value}>{stats.totalAssets}</Text>
          <Text style={styles.percent}>
            {stats.stocks} Ações · {stats.fiis} FIIs
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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  box: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 8,
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  percent: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default PortfolioSummary;
