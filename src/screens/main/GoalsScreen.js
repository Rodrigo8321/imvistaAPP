import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../../styles/colors';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { usePortfolio } from '../../contexts/PortfolioContext';

const GoalsScreen = ({ navigation }) => {
  const { portfolio, getPortfolioStats } = usePortfolio();
  const stats = getPortfolioStats();

  // Mock inicial de metas. Futuramente persistir no Storage/Context
  const [goals, setGoals] = useState([
    { id: 1, title: 'Primeiros 10k', target: 10000, deadline: '2025-12-31' },
    { id: 2, title: 'Reserva de Emergência', target: 50000, deadline: '2026-06-30' },
    { id: 3, title: 'Liberdade Financeira', target: 1000000, deadline: '2030-01-01' },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');

  const handleAddGoal = () => {
    if (!newTitle || !newTarget) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    const targetVal = parseFloat(newTarget.replace(',', '.'));
    if (isNaN(targetVal)) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    setGoals([...goals, {
      id: Date.now(),
      title: newTitle,
      target: targetVal,
      deadline: 'Indefinido'
    }]);
    setIsAdding(false);
    setNewTitle('');
    setNewTarget('');
  };

  const renderGoalCard = (goal) => {
    const progress = Math.min((stats.totalCurrent / goal.target), 1);
    const progressPercent = progress * 100;
    const missing = Math.max(goal.target - stats.totalCurrent, 0);

    return (
      <View key={goal.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.goalTitle}>{goal.title}</Text>
          <Text style={styles.goalDeadline}>{goal.deadline}</Text>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>{formatPercent(progressPercent)} concluído</Text>
        </View>

        <View style={styles.detailsRow}>
          <View>
            <Text style={styles.label}>Meta</Text>
            <Text style={styles.value}>{formatCurrency(goal.target)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.label}>Faltam</Text>
            <Text style={styles.value}>{formatCurrency(missing)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Metas 🎯</Text>
        <TouchableOpacity onPress={() => setIsAdding(!isAdding)} style={styles.addButton}>
          <Text style={styles.addButtonText}>{isAdding ? 'Cancelar' : 'Nova Meta'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Você acumulou <Text style={styles.highlight}>{formatCurrency(stats.totalCurrent)}</Text> em patrimônio.
          </Text>
        </View>

        {isAdding && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder="Nome da Meta (ex: Carro Novo)"
              placeholderTextColor={colors.textSecondary}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Valor Alvo (ex: 50000)"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={newTarget}
              onChangeText={setNewTarget}
            />
            <TouchableOpacity style={styles.saveButton} onPress={handleAddGoal}>
              <Text style={styles.saveButtonText}>Salvar Meta</Text>
            </TouchableOpacity>
          </View>
        )}

        {goals.map(renderGoalCard)}
        <View style={{ height: 40 }} />
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text },
  addButton: { padding: 8 },
  addButtonText: { color: colors.primary, fontWeight: 'bold' },
  content: { padding: 20 },
  summary: { marginBottom: 24 },
  summaryText: { color: colors.textSecondary, fontSize: 16 },
  highlight: { color: colors.success, fontWeight: 'bold' },

  addForm: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary
  },
  input: {
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },

  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  goalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  goalDeadline: { fontSize: 12, color: colors.textSecondary },
  progressSection: { marginBottom: 16 },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden'
  },
  progressBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: colors.textSecondary, textAlign: 'right' },
  detailsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 12, color: colors.textSecondary },
  value: { fontSize: 16, fontWeight: 'bold', color: colors.text },
});

export default GoalsScreen;
