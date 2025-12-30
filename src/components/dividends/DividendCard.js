import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import colors from '../../styles/colors';

const DividendCard = ({ ticker, date, amount, type }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.iconPlaceholder}>
          <Text style={styles.iconText}>{ticker ? ticker.substring(0, 2) : '$'}</Text>
        </View>
        <View>
          <Text style={styles.ticker}>{ticker}</Text>
          <Text style={styles.type}>{type} • {date}</Text>
        </View>
      </View>
      <Text style={styles.amount}>R$ {amount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.surfaceHighlight,
  },
  iconText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  ticker: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  type: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: colors.success,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default DividendCard;
