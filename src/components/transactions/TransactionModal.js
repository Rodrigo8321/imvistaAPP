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
  ScrollView,
  Platform,
} from 'react-native';
import colors from '../../styles/colors';
import { transactionService } from '../../services/transactionService';
import HapticsService from '../../services/HapticsService';


const DATE_INPUT_FORMAT = /^\d{2}\/\d{2}\/\d{4}$/; // DD/MM/YYYY

const parseDateInput = (input) => {
  const [day, month, year] = input.split('/');
  if (!day || !month || !year) return null;

  // Mantém a hora e minuto atuais ao parsear a data do input de texto
  const now = new Date();
  const date = new Date(now);
  date.setFullYear(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  return isNaN(date.getTime()) ? null : date;
};

const formatDateToInput = (date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // zero-based months
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const TransactionModal = ({ visible, onClose, portfolio, onTransactionAdded, initialDateInput, onDateChange }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [type, setType] = useState('Compra');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [date, setDate] = useState(new Date());
  const [dateInput, setDateInput] = useState(formatDateToInput(new Date()));
  const [loading, setLoading] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(true);
  const [datePickerMode, setDatePickerMode] = useState('date');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      if (datePickerMode === 'date') {
        setDate(selectedDate);
        setDatePickerMode('time'); // Abre o seletor de hora em seguida
      } else {
        setDate(selectedDate);
        setDateInput(formatDateToInput(selectedDate));
      }
    }
  };

  const handleDateInputChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const day = cleaned.slice(0, 2);
    const month = cleaned.slice(2, 4);
    const year = cleaned.slice(4, 8);
    let formatted = '';
    if (day) formatted += day;
    if (month) formatted += `/${month}`;
    if (year) formatted += `/${year}`;
    setDateInput(formatted);

    if (DATE_INPUT_FORMAT.test(formatted)) {
      const parsed = parseDateInput(formatted);
      if (parsed) {
        setDate(parsed);
      }
    }
  };

  const handleSubmit = async () => {
    // Validate selected asset
    if (!selectedAsset || !selectedAsset.ticker) {
      Alert.alert('Erro', 'Selecione um ativo válido');
      return;
    }

    // Validate mandatory fields
    if (!quantity || !unitPrice || !dateInput) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    // Validate and parse quantity and price
    const qty = parseFloat(quantity.replace(',', '.').replace(/\s/g, ''));
    const price = parseFloat(unitPrice.replace(',', '.').replace(/\s/g, ''));

    if (qty <= 0 || price <= 0) {
      Alert.alert('Erro', 'Valores devem ser maiores que zero');
      return;
    }

    // Validate and parse date input
    if (!DATE_INPUT_FORMAT.test(dateInput)) {
      Alert.alert('Erro', 'Data inválida. Use o formato DD/MM/AAAA');
      return;
    }
    const parsedDate = parseDateInput(dateInput);
    if (!parsedDate) {
      Alert.alert('Erro', 'Data inválida');
      return;
    }

    setLoading(true);
    try {
      const transaction = {
        ticker: selectedAsset.ticker,
        name: selectedAsset.name,
        type,
        quantity: qty,
        unitPrice: price,
        date: parsedDate.toISOString(),
      };

      console.log('📝 [NEW TRANSACTION] Payload:', JSON.stringify(transaction, null, 2));
      const success = await transactionService.addTransaction(transaction);

      if (success) {
        HapticsService.success();
        Alert.alert('Sucesso', `${type} de ${selectedAsset.ticker} registrada!`, [
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
    setSelectedAsset(null);
    setType('Compra');
    setQuantity('');
    setUnitPrice('');
    setDate(new Date());
    setDateInput(formatDateToInput(new Date()));
    setShowAssetPicker(true);
    setShowDatePicker(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setShowAssetPicker(false);
    setUnitPrice((asset.currentPrice || 0).toFixed(2));
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

          <ScrollView showsVerticalScrollIndicator={false}>
            {showAssetPicker ? (
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerTitle}>Selecione um Ativo</Text>
                <ScrollView style={styles.assetList}>
                  {portfolio.map((asset, index) => (
                    <TouchableOpacity
                      key={`asset-picker-${asset.id}-${index}`}
                      style={styles.assetItem}
                      onPress={() => handleSelectAsset(asset)}
                    >
                      <View style={styles.assetIconContainer}>
                        <Text style={styles.assetIcon}>
                          {asset.type === 'Ação' ? '📈' : '🏢'}
                        </Text>
                      </View>
                      <View style={styles.assetItemInfo}>
                        <Text style={styles.assetItemTicker}>{asset.ticker}</Text>
                        <Text style={styles.assetItemName}>{asset.name}</Text>
                      </View>
                      <Text style={styles.assetItemPrice}>
                        R$ {(asset.currentPrice || 0).toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.assetInfo}
                  onPress={() => setShowAssetPicker(true)}
                >
                  <View style={styles.assetHeader}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.icon}>
                        {selectedAsset?.type === 'Ação' ? '📈' : '🏢'}
                      </Text>
                    </View>
                    <View style={styles.assetDetails}>
                      <Text style={styles.ticker}>{selectedAsset?.ticker}</Text>
                      <Text style={styles.name}>{selectedAsset?.name}</Text>
                    </View>
                    <Text style={styles.changeText}>Alterar →</Text>
                  </View>
                </TouchableOpacity>

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

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Data da Transação</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.textSecondary}
                    value={dateInput}
                    editable={false}
                  />
                  <Text style={styles.note}>Data atual será usada automaticamente</Text>
                </View>

                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Quantidade</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 100 ou 0.5"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      value={quantity}
                      onChangeText={setQuantity}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Preço Unitário (R$)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 25.50"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="decimal-pad"
                      value={unitPrice}
                      onChangeText={setUnitPrice}
                    />
                  </View>

                  {quantity && unitPrice && (
                    <View style={styles.totalPreview}>
                      <Text style={styles.totalLabel}>Total Estimado</Text>
                      <Text style={styles.totalValue}>
                        R$ {(parseFloat(quantity.replace(',', '.')) * parseFloat(unitPrice.replace(',', '.'))).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>

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
              </>
            )}
          </ScrollView>
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
    backgroundColor: colors?.background || '#F5F7FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors?.text || '#000000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors?.border || '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    color: colors?.text || '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerTitle: {
    color: colors?.text || '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  assetList: {
    maxHeight: 400,
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors?.surface || '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors?.border || '#E5E5E5',
  },
  assetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors?.border || '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  assetIcon: {
    fontSize: 20,
  },
  assetItemInfo: {
    flex: 1,
  },
  assetItemTicker: {
    color: colors?.text || '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  assetItemName: {
    color: colors?.textSecondary || '#666666',
    fontSize: 12,
  },
  assetItemPrice: {
    color: colors?.primary || '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  assetInfo: {
    backgroundColor: colors?.surface || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors?.border || '#E5E5E5',
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors?.border || '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  assetDetails: {
    flex: 1,
  },
  ticker: {
    color: colors?.text || '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors?.textSecondary || '#666666',
    fontSize: 14,
  },
  changeText: {
    color: colors?.primary || '#007AFF',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: colors?.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors?.border || '#E5E5E5',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors?.primary || '#007AFF',
    borderColor: colors?.primary || '#007AFF',
  },
  typeButtonText: {
    color: colors?.textSecondary || '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors?.text || '#000000',
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors?.text || '#000000',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors?.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors?.border || '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors?.text || '#000000',
  },
  totalPreview: {
    backgroundColor: (colors?.primary || '#007AFF') + '10',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  totalLabel: {
    color: colors?.primary || '#007AFF',
    fontSize: 12,
    marginBottom: 4,
  },
  totalValue: {
    color: colors?.primary || '#007AFF',
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
    backgroundColor: colors?.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors?.border || '#E5E5E5',
  },
  cancelButtonText: {
    color: colors?.textSecondary || '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors?.primary || '#007AFF',
  },
  submitButtonText: {
    color: colors?.text || '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors?.surface || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors?.border || '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 16,
    color: colors?.text || '#000000',
    paddingVertical: 12,
  },
  dateIcon: {
    fontSize: 22,
  },
  note: {
    color: colors?.textSecondary || '#666666',
    fontSize: 12,
    marginTop: 4,
  },
});

export default TransactionModal;
