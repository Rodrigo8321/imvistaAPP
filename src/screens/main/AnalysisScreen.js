import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { colors } from '../../styles/colors';
import { mockPortfolio } from '../../data/mockAssets';

import PortfolioSummary from '../../components/analysis/PortfolioSummary';
import DiversificationChart from '../../components/analysis/DiversificationChart';
import PerformanceComparison from '../../components/analysis/PerformanceComparison';
import RecommendationsCard from '../../components/analysis/RecommendationsCard';
import SectorDistribution from '../../components/analysis/SectorDistribution';

const AnalysisScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [portfolio] = useState(mockPortfolio);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Análise</Text>
          <Text style={styles.subtitle}>Análise completa do seu portfolio</Text>
        </View>

        {/* Resumo Geral */}
        <PortfolioSummary portfolio={portfolio} />

        {/* Diversificação */}
        <View style={styles.sectionContainer}>
          <DiversificationChart portfolio={portfolio} />
        </View>

        {/* Performance */}
        <View style={styles.sectionContainer}>
          <PerformanceComparison portfolio={portfolio} />
        </View>

        {/* Distribuição por Setor */}
        <View style={styles.sectionContainer}>
          <SectorDistribution portfolio={portfolio} />
        </View>

        {/* Recomendações */}
        <View style={styles.sectionContainer}>
          <RecommendationsCard portfolio={portfolio} />
        </View>

        {/* Footer Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  infoBox: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    marginBottom: 12,
  },
  infoText: {
    color: colors.primary,
    fontSize: 13,
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 8,
  },
  analysisCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ticker: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  sector: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recommendationBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  scoreText: {
    color: '#ffffff',
    fontSize: 11,
    opacity: 0.9,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  preview: {
    backgroundColor: colors.success + '20',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
  previewWeak: {
    backgroundColor: colors.warning + '20',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  previewTextWeak: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  tapHint: {
    color: colors.primary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTicker: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  modalRecommendation: {
    padding: 20,
    alignItems: 'center',
  },
  modalRecommendationText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalScore: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.9,
  },
  modalScroll: {
    padding: 20,
  },
  modalSection: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 16,
  },
  fundamentalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  fundamentalItem: {
    width: '31%',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  fundamentalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fundamentalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  strengthItem: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success + '40',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '600',
  },
  strengthValue: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  strengthReason: {
    color: colors.success,
    fontSize: 12,
    opacity: 0.8,
  },
  weaknessItem: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  weaknessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weaknessLabel: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: '600',
  },
  weaknessValue: {
    color: colors.warning,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weaknessReason: {
    color: colors.warning,
    fontSize: 12,
    opacity: 0.8,
  },
  alertItem: {
    backgroundColor: colors.danger + '20',
    borderWidth: 1,
    borderColor: colors.danger + '40',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertText: {
    color: colors.danger,
    fontSize: 13,
  },
});

export default AnalysisScreen;
