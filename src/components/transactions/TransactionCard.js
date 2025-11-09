import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';

const TransactionCard = ({ transaction, onDelete }) => {
  const isCompra = transaction.type === 'Compra';
  const total = transaction.quantity * transaction.unitPrice;
  const profit = transaction.profit || 0;
  const profitPercent = transaction.profitPercent || 0;

  // Formatar data
  const date = new Date(transaction.date);
  const dateStr = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
  const timeStr = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Cores baseado no tipo
  const backgroundColor = isCompra
    ? colors.primary + '15'
    : colors.success + '15';
  const borderColor = isCompra
    ? colors.primary
    : colors.success;
  const typeIcon = isCompra ? '✅' : '📊';
  const typeText = isCompra ? 'COMPRA' : 'VENDA';

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={[styles.typeText, { color: borderColor }]}>
            {typeText}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete && onDelete(transaction.id)}
        >
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Ticker e Nome */}
      <View style={styles.assetInfo}>
        <Text style={styles.ticker}>{transaction.ticker}</Text>
        <Text style={styles.name}>{transaction.name}</Text>
      </View>

      {/* Detalhes */}
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Quantidade</Text>
          <Text style={styles.detailValue}>{transaction.quantity} un</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Preço Unitário</Text>
          <Text style={styles.detailValue}>
            {formatCurrency(transaction.unitPrice)}
          </Text>
        </View>

        <View style={[styles.detailRow, styles.totalRow]}>
          <Text style={styles.detailLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {formatCurrency(total)}
          </Text>
        </View>
      </View>

      {/* Lucro (só para venda) */}
      {!isCompra && profit !== 0 && (
        <View style={[
          styles.profitSection,
          { backgroundColor: profit >= 0 ? colors.success + '20' : colors.danger + '20' }
        ]}>
          <View style={styles.profitRow}>
            <Text style={styles.profitLabel}>Lucro</Text>
            <Text style={[
              styles.profitValue,
              { color: profit >= 0 ? colors.success : colors.danger }
            ]}>
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
            </Text>
          </View>
          <Text style={[
            styles.profitPercent,
            { color: profit >= 0 ? colors.success : colors.danger }
          ]}>
            {profit >= 0 ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(2)}%
          </Text>
        </View>
      )}

      {/* Data e Hora */}
      <View style={styles.footer}>
        <Text style={styles.datetime}>
          📅 {dateStr}, {timeStr}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  typeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  assetInfo: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  ticker: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  details: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  totalRow: {
    marginBottom: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  profitSection: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  profitLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  profitValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  profitPercent: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  datetime: {
    color: colors.textSecondary,
    fontSize: 11,
  },
});

export default TransactionCard;
