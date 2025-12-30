import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LinearGradient from '../common/Gradient';
import colors from '../../styles/colors';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const { width } = Dimensions.get('window');

const StockAnalysisCard = ({ symbol, fundamentals }) => {
  if (!fundamentals) return <Text style={styles.loadingText}>Carregando análise de {symbol}...</Text>;

  const calculateAnalysis = (f) => {
    let score = 0;

    // Configurações do Card (Expects decimals for ROE/DY)
    const precoAtual = f.price || 0;
    const dy = f.dividendYield || 0; // Ex: 0.06
    const pe = f.pe || 0;
    const roe = f.roe || 0;
    const debtEbitda = f.debtEbitda || 0;
    const pb = f.pbValue || 0;

    // Bazin: Dividendo anual / 0.06
    const dividendoEstimado = precoAtual * dy;
    const precoTetoBazin = dy > 0 ? (dividendoEstimado / 0.06) : 0;
    const margemSeguranca = precoAtual > 0 ? ((precoTetoBazin / precoAtual) - 1) * 100 : 0;

    // Sistema de Pontos (Personalizado - Barsi, Graham, Bazin, Munger)
    if (dy >= 0.06) score += 2.5; // Foco em Renda (Barsi)
    if (pe > 0 && pe <= 15) score += 2.0; // Preço Justo (Graham)
    if (roe >= 0.15) score += 2.5; // Eficiência (Munger)
    if (debtEbitda <= 2.5 && debtEbitda >= 0) score += 2.0; // Segurança
    if (pb > 0 && pb <= 2) score += 1.0; // Valor Patrimonial

    let status = "NEUTRO";
    let statusColor = colors.warning;

    if (score >= 7.5) {
      status = "COMPRA (Forte)";
      statusColor = colors.success;
    } else if (score < 5) {
      status = "CARO / RISCO";
      statusColor = colors.danger;
    }

    return {
      score,
      precoTetoBazin,
      precoTetoBarsi: precoTetoBazin,
      margemSeguranca,
      status,
      color: statusColor,
      dy,
      pe,
      roe,
      debtEbitda,
      pb,
      lpa: f.lpa,
      vpa: f.vpa,
      roic: f.roic
    };
  };

  const ana = calculateAnalysis(fundamentals);

  const TrendIcon = ({ type }) => {
    if (!type) return null;
    return (
      <Ionicons
        name={type === 'up' ? "trending-up" : "trending-down"}
        size={14}
        color={type === 'up' ? colors.success : colors.danger}
        style={{ marginLeft: 4 }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[ana.color + '20', colors.surface]}
        style={[styles.card, { borderLeftColor: ana.color, borderLeftWidth: 4 }]}
      >
        <View style={[styles.indicatorBar, { backgroundColor: ana.color, width: `${ana.score * 10}%` }]} />
        <View style={styles.header}>
          <View>
            <Text style={styles.symbolText}>{symbol}</Text>
            <Text style={styles.scoreText}>Score: {ana.score.toFixed(1)} / 10</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: ana.color }]}>
            <Text style={styles.badgeText}>{ana.status}</Text>
          </View>
        </View>

        {/* ESTRATÉGIA BAZIN */}
        <View style={styles.bazinBox}>
          <Text style={styles.bazinTitle}>🎯 Preço-Teto (Estratégia 6%)</Text>
          <View style={styles.row}>
            <View style={styles.bazinItem}>
              <Text style={styles.label}>Preço Teto</Text>
              <Text style={styles.value}>{formatCurrency(ana.precoTetoBarsi)}</Text>
            </View>
            <View style={styles.bazinDivider} />
            <View style={styles.bazinItem}>
              <Text style={styles.label}>Margem Seg.</Text>
              <Text style={[styles.value, { color: ana.margemSeguranca > 0 ? colors.success : colors.danger }]}>
                {ana.margemSeguranca.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* VALORES POR AÇÃO */}
        {(ana.lpa || ana.vpa) && (
          <View style={styles.perShareRow}>
            {ana.lpa && (
              <View style={styles.perShareItem}>
                <Text style={styles.perShareLabel}>LPA: </Text>
                <Text style={styles.perShareValue}>{formatCurrency(ana.lpa)}</Text>
              </View>
            )}
            {ana.vpa && (
              <View style={styles.perShareItem}>
                <Text style={styles.perShareLabel}>VPA: </Text>
                <Text style={styles.perShareValue}>{formatCurrency(ana.vpa)}</Text>
              </View>
            )}
          </View>
        )}

        {/* GRID DE MÉTRICAS */}
        <Text style={styles.sectionTitle}>Qualidade Fundamentalista</Text>
        <View style={styles.grid}>
          <Metric
            label="P/L"
            val={ana.pe ? ana.pe.toFixed(2) : '-'}
            sub="Graham"
            ok={ana.pe < 15 && ana.pe > 0}
            trend={fundamentals.trends?.pe}
          />
          <Metric
            label="ROE"
            val={formatPercent(ana.roe * 100)}
            sub="Munger"
            ok={ana.roe >= 0.15}
            trend={fundamentals.trends?.roe}
          />
          <Metric
            label="DY"
            val={formatPercent(ana.dy * 100)}
            sub="Barsi"
            ok={ana.dy >= 0.06}
            trend={fundamentals.trends?.dy}
          />
          <Metric
            label="Dív.L/EBITDA"
            val={ana.debtEbitda !== null ? ana.debtEbitda.toFixed(2) : '-'}
            sub="Saúde"
            ok={ana.debtEbitda < 2.5 && ana.debtEbitda >= 0}
          />
          {ana.roic !== null && (
            <Metric
              label="ROIC"
              val={formatPercent(ana.roic * 100)}
              sub="Eficiência"
              ok={ana.roic >= 0.12}
            />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const Metric = ({ label, val, sub, ok, trend }) => (
  <View style={styles.metricBox}>
    <Text style={styles.metricLabel}>{label}</Text>
    <View style={styles.valueRow}>
      <Text style={[styles.metricValue, { color: ok ? colors.text : colors.danger }]}>{val}</Text>
      {trend && (
        <Ionicons
          name={trend === 'up' ? "arrow-up" : "arrow-down"}
          size={12}
          color={trend === 'up' ? colors.success : colors.danger}
          style={{ marginLeft: 3 }}
        />
      )}
    </View>
    <Text style={styles.metricSub}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  indicatorBar: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  symbolText: { fontSize: 22, fontWeight: '800', color: colors.text },
  scoreText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#000', fontWeight: 'bold', fontSize: 11 },

  bazinBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20
  },
  bazinTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 12, fontWeight: '700', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  bazinItem: { flex: 1, alignItems: 'center' },
  bazinDivider: { width: 1, backgroundColor: colors.border, height: '80%' },
  label: { fontSize: 10, color: colors.textMuted, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800', color: colors.text },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  metricBox: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  metricLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'center' },
  metricValue: { fontSize: 16, fontWeight: '700' },
  metricSub: { fontSize: 10, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  perShareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 8,
    borderRadius: 8
  },
  perShareItem: { flexDirection: 'row', alignItems: 'center' },
  perShareLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  perShareValue: { fontSize: 13, color: colors.text, fontWeight: 'bold' },
  loadingText: { color: colors.textSecondary, textAlign: 'center', padding: 20 }
});

export default StockAnalysisCard;
