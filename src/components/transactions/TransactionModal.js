import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../styles/colors';
import { transactionService } from '../../services/transactionService';

const TransactionModal = ({ visible, onClose, asset, onTransactionAdded }) => {
  const [type, setType] = useState('Compra');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!quantity || !unitPrice) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice.replace(',', '.'));

    if (qty <= 0 || price <= 0) {
      Alert.alert('Erro', 'Valores devem ser maiores que zero');
      return;
    }

    setLoading(true);
    try {
      const transaction = {
        ticker: asset.ticker,
        name: asset.name,
        type,
        quantity: qty,
        unitPrice: price,
        date: new Date().toISOString(),
      };

      const success = await transactionService.addTransaction(transaction);

      if (success) {
        Alert.alert('Sucesso', `${type} de ${asset.ticker} registrada!`, [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onTransactionAdded && onTransactionAdded();
              onClose();
            }
          }
        ]);
      } else {
        Alert.alert('Erro', 'Não foi possível registrar a transação');
      }
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('Compra');
    setQuantity('');
    setUnitPrice('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Nova Transação</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Asset Info */}
          <View style={styles.assetInfo}>
            <View style={styles.assetHeader}>
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>
                  {asset?.type === 'Ação' ? '📈' : '🏢'}
                </Text>
              </View>
              <View>
                <Text style={styles.ticker}>{asset?.ticker}</Text>
                <Text style={styles.name}>{asset?.name}</Text>
              </View>
            </View>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, type === 'Compra' && styles.typeButtonActive]}
              onPress={() => setType('Compra')}
            >
              <Text style={[styles.typeButtonText, type === 'Compra' && styles.typeButtonTextActive]}>
                💰 Compra
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, type === 'Venda' && styles.typeButtonActive]}
              onPress={() => setType('Venda')}
            >
              <Text style={[styles.typeButtonText, type === 'Venda' && styles.typeButtonTextActive]}>
                💸 Venda
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 100"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preço Unitário (R$)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 25.50"
                keyboardType="decimal-pad"
                value={unitPrice}
                onChangeText={setUnitPrice}
              />
            </View>

            {/* Total Preview */}
            {quantity && unitPrice && (
              <View style={styles.totalPreview}>
                <Text style={styles.totalLabel}>Total Estimado</Text>
                <Text style={styles.totalValue}>
                  R$ {(parseFloat(quantity) * parseFloat(unitPrice.replace(',', '.'))).toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Registrar {type}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  assetInfo: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  ticker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.text,
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  totalPreview: {
    backgroundColor: colors.primary + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  totalLabel: {
    color: colors.primary,
    fontSize: 12,
    marginBottom: 4,
  },
  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TransactionModal;
