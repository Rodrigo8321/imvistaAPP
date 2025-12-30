import React from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import colors from '../../styles/colors';

const screenWidth = Dimensions.get('window').width;

const PortfolioChart = ({ data, labels }) => {
  const chartConfig = {
    backgroundGradientFrom: colors.chartGradientFrom,
    backgroundGradientTo: colors.chartGradientTo,
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 208, 156, ${opacity})`, // colors.primary
    labelColor: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`, // colors.textSecondary
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
    propsForBackgroundLines: {
      strokeWidth: 1,
      stroke: colors.surfaceHighlight,
      strokeDasharray: "0",
    }
  };

  const chartData = {
    labels: labels || ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        data: data || [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance (6M)</Text>
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default PortfolioChart;
