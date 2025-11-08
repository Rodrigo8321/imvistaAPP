import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'recharts';
import { colors } from '../../styles/colors';

const { width } = Dimensions.get('window');

/**
 * Componente que exibe um gráfico de evolução de preço
 * @param {object} asset - Dados do ativo
 * @param {number} period - Período em dias (7, 30, 90, 365)
 */
const PriceChart = ({ asset, period = 30 }) => {
  // Gerar dados mock de preço histórico
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = period; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Simula variação de preço com padrão realista
      const variation = (Math.random() - 0.5) * 4;
      const price = asset.avgPrice + (asset.currentPrice - asset.avgPrice) * (i / period) + variation;
      
      data.push({
        day: `${date.getDate()}/${date.getMonth() + 1}`,
        price: parseFloat(price.toFixed(2)),
        fullDate: date.toISOString().split('T')[0],
      });
    }
    
    return data;
  }, [asset, period]);

  // Calcular min, max e variação
  const stats = useMemo(() => {
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const variation = ((asset.currentPrice - chartData[0].price) / chartData[0].price) * 100;
    
    return { min, max, variation };
  }, [chartData, asset.currentPrice]);

  // Definir cores baseado no desempenho
  const isPositive = stats.variation >= 0;
  const lineColor = isPositive ? colors.success : colors.danger;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Evolução de Preço</Text>
          <Text style={styles.period}>Últimos {period} dias</Text>
        </View>
        <View style={[styles.badge, { 
          backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20' 
        }]}>
          <Text style={[styles.badgeText, { 
            color: isPositive ? colors.success : colors.danger 
          }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(stats.variation).toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* Gráfico */}
      <View style={styles.chartContainer}>
        <LineChart
          width={width - 40}
          height={250}
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <LineChart.Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            dot={false}
            strokeWidth={2.5}
            isAnimationActive={true}
          />
          <LineChart.XAxis
            dataKey="day"
            tick={{ fill: colors.textSecondary, fontSize: 12 }}
            stroke={colors.border}
          />
          <LineChart.YAxis
            tick={{ fill: colors.textSecondary, fontSize: 12 }}
            stroke={colors.border}
          />
          <LineChart.Tooltip
            contentStyle={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
            }}
            labelStyle={{ color: colors.text }}
            formatter={(value) => `R$ ${value.toFixed(2)}`}
          />
        </LineChart>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mínimo</Text>
          <Text style={styles.statValue}>R$ {stats.min.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Máximo</Text>
          <Text style={styles.statValue}>R$ {stats.max.toFixed(2)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Atual</Text>
          <Text style={styles.statValue}>R$ {asset.currentPrice.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  period: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
});

export default PriceChart;
