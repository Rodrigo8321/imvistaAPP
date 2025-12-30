import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import colors from '../../styles/colors';
import DividendCard from '../../components/dividends/DividendCard';
import DividendCalendar from '../../components/dividends/DividendCalendar';

const screenWidth = Dimensions.get('window').width;

const DividendsScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');

  // Mock Data - Futuramente virá do Contexto/API
  const dividendData = {
    labels: [],
    datasets: [
      {
        data: []
      }
    ]
  };

  const recentDividends = [];

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    fillShadowGradientFrom: colors.primary,
    fillShadowGradientTo: colors.primary,
    fillShadowGradientOpacity: 0.6,
    decimalPlaces: 0,
    color: (opacity = 1) => colors.primary,
    labelColor: (opacity = 1) => colors.textSecondary,
    barPercentage: 0.5,
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
    propsForLabels: {
      fontSize: 10,
      fontWeight: 'bold'
    }
  };

  const filteredDividends = selectedDate
    ? recentDividends.filter(item => {
      const [d, m, y] = item.date.split('/');
      return `${y}-${m}-${d}` === selectedDate;
    })
    : recentDividends;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Proventos</Text>
        <Text style={styles.subtitle}>Total recebido em 2025</Text>
        <Text style={styles.totalValue}>R$ 0,00</Text>
      </View>

      <DividendCalendar
        dividends={recentDividends}
        selectedDate={selectedDate}
        onDayPress={setSelectedDate}
      />

      <View style={styles.listContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
            {selectedDate ? `Pagamentos em ${selectedDate.split('-').reverse().join('/')}` : 'Últimos Pagamentos'}
          </Text>
          {selectedDate ? (
            <TouchableOpacity onPress={() => setSelectedDate('')}>
              <Text style={{ color: colors.primary }}>Limpar Filtro</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {filteredDividends.length === 0 ? (
          <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
            Nenhum pagamento nesta data.
          </Text>
        ) : (
          filteredDividends.map((item) => (
            <DividendCard
              key={item.id}
              ticker={item.ticker}
              date={item.date}
              amount={item.amount}
              type={item.type}
            />
          ))
        )}
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Evolução Mensal</Text>
        <BarChart
          data={dividendData}
          width={screenWidth - 32}
          height={200}
          yAxisLabel="R$ "
          chartConfig={chartConfig}
          style={styles.chart}
          showBarTops={false}
          showValuesOnTopOfBars={true}
          fromZero
          flatColor={true} // ChartKit: use solido
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.success,
    marginTop: 4,
    letterSpacing: -1,
  },
  chartContainer: {
    padding: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    paddingLeft: 4,
  },
  chart: {
    paddingRight: 0,
    paddingLeft: 0,
  },
  listContainer: {
    padding: 16,
  }
});

export default DividendsScreen;
