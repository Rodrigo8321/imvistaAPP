import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../styles/colors';

const AssetCard = ({ asset, onPress }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('AssetDetail', { asset });
    }
  };
  const profit = (asset.currentPrice - asset.avgPrice) * asset.quantity;
  const profitPercent = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
  const isPositive = profit >= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {asset.type === 'Ação' ? '📈' : '🏢'}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.ticker}>{asset.ticker}</Text>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Preço Atual</Text>
          <Text style={styles.price}>R$ {asset.currentPrice.toFixed(2)}</Text>
        </View>
        <View style={[styles.changeBadge, {
          backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20'
        }]}>
          <Text style={[styles.changeText, {
            color: isPositive ? colors.success : colors.danger
          }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  ticker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AssetCard;
