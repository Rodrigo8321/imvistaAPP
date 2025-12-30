import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from '../../components/common/Gradient';
import colors from '../../styles/colors';
import BrapiService from '../../services/brapiService';
import AlphaVantageService from '../../services/alphaVantageService';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const StockComparisonScreen = ({ navigation }) => {
  const [ticker1, setTicker1] = useState('');
  const [ticker2, setTicker2] = useState('');
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!ticker1 || !ticker2) return;

    setLoading(true);
    try {
      const [res1, res2] = await Promise.all([
        AlphaVantageService.getFundamentalData(ticker1.toUpperCase().trim()),
        AlphaVantageService.getFundamentalData(ticker2.toUpperCase().trim())
      ]);

      // Mapear dados do Alpha Vantage para o formato esperado
      const mapData = (data, symbol) => ({
        symbol: symbol,
        pe: data?.pe || data?.priceEarnings,
        pvp: data?.pvp || data?.priceToBook,
        dy: (data?.dy || data?.dividendYield) ? (data?.dy || data?.dividendYield) / 100 : null, // Converter de % para decimal
        roe: (data?.roe || data?.returnOnEquity) ? (data?.roe || data?.returnOnEquity) / 100 : null, // Converter de % para decimal
        debtEbitda: null, // Alpha Vantage não fornece diretamente
        liquidMargin: null, // Alpha Vantage não fornece diretamente
        roic: null // Alpha Vantage não fornece diretamente
      });

      setData1(res1 ? mapData(res1, ticker1.toUpperCase().trim()) : null);
      setData2(res2 ? mapData(res2, ticker2.toUpperCase().trim()) : null);
    } catch (error) {
      console.error('Erro na comparação:', error);
    } finally {
      setLoading(false);
    }
  };

  const ComparisonRow = ({ label, val1, val2, isHigherBetter = true, format = (v) => v }) => {
    const v1 = parseFloat(val1);
    const v2 = parseFloat(val2);

    let winner = null;
    if (!isNaN(v1) && !isNaN(v2)) {
      if (v1 !== v2) {
        winner = isHigherBetter ? (v1 > v2 ? 1 : 2) : (v1 < v2 ? 1 : 2);
      }
    }

    return (
      <View style={styles.row}>
        <View style={[styles.cell, winner === 1 && styles.winnerCell]}>
          <Text style={[styles.cellValue, winner === 1 && styles.winnerText]}>{format(val1)}</Text>
        </View>
        <View style={styles.labelCell}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
        <View style={[styles.cell, winner === 2 && styles.winnerCell]}>
          <Text style={[styles.cellValue, winner === 2 && styles.winnerText]}>{format(val2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inputsRow}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ativo 1"
            placeholderTextColor={colors.textMuted}
            value={ticker1}
            onChangeText={setTicker1}
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ativo 2"
            placeholderTextColor={colors.textMuted}
            value={ticker2}
            onChangeText={setTicker2}
            autoCapitalize="characters"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.compareButton, (!ticker1 || !ticker2) && styles.disabledButton]}
        onPress={handleCompare}
        disabled={loading || !ticker1 || !ticker2}
      >
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.compareButtonText}>Comparar Agora</Text>}
      </TouchableOpacity>

      {data1 && data2 && (
        <View style={styles.comparisonTable}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.headerTicker}>{data1.symbol}</Text>
            <Text style={styles.headerVS}>Métrica</Text>
            <Text style={styles.headerTicker}>{data2.symbol}</Text>
          </View>

          <ComparisonRow
            label="P/L"
            val1={data1.pe}
            val2={data2.pe}
            isHigherBetter={false}
            format={v => v?.toFixed(2) || '-'}
          />
          <ComparisonRow
            label="P/VP"
            val1={data1.pvp}
            val2={data2.pvp}
            isHigherBetter={false}
            format={v => v?.toFixed(2) || '-'}
          />
          <ComparisonRow
            label="DY"
            val1={data1.dy}
            val2={data2.dy}
            format={v => formatPercent(v * 100)}
          />
          <ComparisonRow
            label="ROE"
            val1={data1.roe}
            val2={data2.roe}
            format={v => formatPercent(v * 100)}
          />
          <ComparisonRow
            label="Dív/EBITDA"
            val1={data1.debtEbitda}
            val2={data2.debtEbitda}
            isHigherBetter={false}
            format={v => v?.toFixed(2) || '-'}
          />
          <ComparisonRow
            label="Margem Líq."
            val1={data1.liquidMargin}
            val2={data2.liquidMargin}
            format={v => formatPercent(v * 100)}
          />
          <ComparisonRow
            label="ROIC"
            val1={data1.roic}
            val2={data2.roic}
            format={v => formatPercent(v * 100)}
          />
        </View>
      )}

      {!data1 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="git-compare-outline" size={64} color={colors.surfaceHighlight} />
          <Text style={styles.emptyText}>Escolha dois ativos para ver quem ganha no duelo fundamentalista.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  inputsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  inputContainer: { flex: 1 },
  input: {
    backgroundColor: colors.surface,
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  vsContainer: { paddingHorizontal: 15 },
  vsText: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  compareButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30
  },
  disabledButton: { opacity: 0.5 },
  compareButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  comparisonTable: { backgroundColor: colors.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.surfaceHighlight, paddingVertical: 12 },
  headerTicker: { flex: 1, textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 14 },
  headerVS: { width: 80, textAlign: 'center', color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  cell: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  labelCell: { width: 80, alignItems: 'center' },
  labelText: { color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' },
  cellValue: { color: colors.text, fontSize: 14, fontWeight: '500' },
  winnerCell: { backgroundColor: 'rgba(46, 204, 113, 0.1)' },
  winnerText: { color: colors.success, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 16, paddingHorizontal: 40, lineHeight: 20 }
});

export default StockComparisonScreen;
