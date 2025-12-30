import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import colors from '../../styles/colors';

/**
 * Componente que exibe dados fundamentalistas de um ativo
 * @param {object} asset - Dados do ativo com fundamentals
 * @param {string} type - Tipo do ativo ('Ação' ou 'FII')
 */
const FundamentalsCard = ({ asset, type = 'Ação' }) => {
  const { fundamentals } = asset;

  // Log para identificar problemas com ROE
  console.log(`[LOG ROE] FundamentalsCard - Asset: ${asset.symbol || 'N/A'}, Fundamentals:`, fundamentals);
  console.log(`[LOG ROE] ROE value: ${fundamentals.roe}, Type: ${typeof fundamentals.roe}`);
  console.log(`[LOG ROE] ReturnOnEquity value: ${fundamentals.returnOnEquity}, Type: ${typeof fundamentals.returnOnEquity}`);

  // Indicadores para Ações
  const stockIndicators = [
    { label: 'P/L', value: fundamentals.pl, tooltip: 'Preço/Lucro' },
    { label: 'P/VP', value: fundamentals.pvp, tooltip: 'Preço/Valor Patrimonial' },
    { label: 'ROE', value: `${fundamentals.roe}%`, tooltip: 'Retorno sobre Patrimônio' },
    { label: 'Div. Yield', value: `${fundamentals.dy}%`, tooltip: 'Rendimento de Dividendos' },
    { label: 'Marg. Liq.', value: `${fundamentals.margLiq}%`, tooltip: 'Margem Líquida' },
    { label: 'LPA', value: `R$ ${fundamentals.lpa}`, tooltip: 'Lucro por Ação' },
    { label: 'VPA', value: `R$ ${fundamentals.vpa}`, tooltip: 'Valor Patrimonial por Ação' },
  ];

  // Indicadores para FIIs
  const fiIIndicators = [
    { label: 'P/VP', value: fundamentals.pvp, tooltip: 'Preço/Valor Patrimonial' },
    { label: 'Div. Yield', value: `${fundamentals.dy}%`, tooltip: 'Rendimento de Dividendos' },
    { label: 'VPA', value: `R$ ${fundamentals.vpa}`, tooltip: 'Valor Patrimonial por Ação' },
    { label: 'Vacância', value: `${fundamentals.vacancia}%`, tooltip: 'Imóveis Vazios' },
  ];

  const indicators = type === 'FII' ? fiIIndicators : stockIndicators;

  // Avaliar qualidade do indicador (verde/amarelo/vermelho)
  const getIndicatorColor = (label, value) => {
    const numValue = parseFloat(value);
    
    switch (label) {
      case 'P/L':
      case 'P/VP':
        return numValue < 15 ? colors.success : numValue < 25 ? colors.warning : colors.danger;
      case 'ROE':
        return numValue > 15 ? colors.success : numValue > 10 ? colors.warning : colors.danger;
      case 'Div. Yield':
        return numValue > 8 ? colors.success : numValue > 5 ? colors.warning : colors.danger;
      case 'Vacância':
        return numValue < 5 ? colors.success : numValue < 10 ? colors.warning : colors.danger;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Indicadores Fundamentalistas</Text>
        <Text style={styles.type}>{type === 'FII' ? 'FII' : 'Ação'}</Text>
      </View>

      <View style={styles.indicatorsGrid}>
        {indicators.map((indicator, index) => {
          const color = getIndicatorColor(indicator.label, indicator.value);
          
          return (
            <View key={index} style={styles.indicatorBox}>
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              
              <View style={styles.indicatorContent}>
                <Text style={styles.indicatorLabel}>{indicator.label}</Text>
                <Text style={styles.indicatorValue}>{indicator.value}</Text>
                <Text style={styles.indicatorTooltip}>{indicator.tooltip}</Text>
              </View>

              <View style={[styles.indicator, { backgroundColor: color + '20' }]}>
                <Text style={[styles.indicatorDot, { color }]}>●</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Legenda */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Bom</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
          <Text style={styles.legendText}>Médio</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>Ruim</Text>
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  type: {
    color: colors.textSecondary,
    fontSize: 12,
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indicatorsGrid: {
    marginBottom: 16,
  },
  indicatorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  colorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  indicatorContent: {
    flex: 1,
  },
  indicatorLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  indicatorValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  indicatorTooltip: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  indicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    fontSize: 20,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});

export default FundamentalsCard;
