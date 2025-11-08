/**
 * Componente que exibe recomendações baseadas na análise do portfolio
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../styles/colors';

const RecommendationsCard = ({ portfolio }) => {
  const recommendations = useMemo(() => {
    const recs = [];

    if (!portfolio || portfolio.length === 0) {
      return [{
        icon: '📊',
        title: 'Portfolio Vazio',
        description: 'Adicione ativos ao seu portfolio para obter recomendações.',
        priority: 'low',
      }];
    }

    // 1. Verificar concentração
    const byType = portfolio.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});

    const stocks = byType['Ação'] || 0;
    const fiis = byType['FII'] || 0;
    const totalAssets = stocks + fiis;

    if (stocks > 0 && fiis === 0) {
      recs.push({
        icon: '⚠️',
        title: 'Diversificar com FIIs',
        description: 'Portfolio com apenas ações. Considere adicionar FIIs para renda passiva.',
        priority: 'high',
      });
    } else if (fiis > 0 && stocks === 0) {
      recs.push({
        icon: '⚠️',
        title: 'Diversificar com Ações',
        description: 'Portfolio com apenas FIIs. Considere adicionar ações para crescimento.',
        priority: 'high',
      });
    }

    // 2. Verificar performance
    const avgPerformance = portfolio.reduce((sum, asset) => {
      return sum + ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
    }, 0) / portfolio.length;

    if (avgPerformance > 10) {
      recs.push({
        icon: '🎯',
        title: 'Performance Excelente',
        description: `Portfolio com performance média de ${avgPerformance.toFixed(2)}%. Mantenha a estratégia.`,
        priority: 'low',
      });
    } else if (avgPerformance < -5) {
      recs.push({
        icon: '⚠️',
        title: 'Revisar Portfolio',
        description: 'Performance negativa. Analise os ativos de pior desempenho.',
        priority: 'high',
      });
    }

    // 3. Verificar ativos com baixo dividend yield
    const lowDividend = portfolio.filter(a => a.fundamentals?.dy && a.fundamentals.dy < 5);
    if (lowDividend.length > 0 && lowDividend.length <= portfolio.length / 2) {
      recs.push({
        icon: '💰',
        title: 'Ativos com Baixo Yield',
        description: `${lowDividend.length} ativo(s) com dividend yield abaixo de 5%. Avalie continuar.`,
        priority: 'medium',
      });
    }

    // 4. Verificar diversificação de setores
    const sectors = new Set(portfolio.map(a => a.sector));
    if (sectors.size < 3 && portfolio.length >= 3) {
      recs.push({
        icon: '🌐',
        title: 'Diversificar Setores',
        description: `Portfolio concentrado em ${sectors.size} setor(es). Busque mais diversificação.`,
        priority: 'medium',
      });
    }

    // 5. Se tudo ok
    if (recs.length === 0) {
      recs.push({
        icon: '✅',
        title: 'Portfolio Saudável',
        description: 'Seu portfolio está bem estruturado. Continue monitorando.',
        priority: 'low',
      });
    }

    return recs;
  }, [portfolio]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return colors.danger;
      case 'medium':
        return colors.warning;
      default:
        return colors.success;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Prioritário';
      case 'medium':
        return 'Médio';
      default:
        return 'Baixo';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Recomendações</Text>

      {recommendations.map((rec, index) => (
        <View key={index} style={styles.recCard}>
          <View style={styles.recHeader}>
            <Text style={styles.recIcon}>{rec.icon}</Text>
            <View style={styles.recTitleContainer}>
              <Text style={styles.recTitle}>{rec.title}</Text>
              <View
                style={[styles.priorityBadge, {
                  backgroundColor: getPriorityColor(rec.priority) + '20',
                }]}
              >
                <Text
                  style={[styles.priorityText, {
                    color: getPriorityColor(rec.priority),
                  }]}
                >
                  {getPriorityLabel(rec.priority)}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.recDescription}>{rec.description}</Text>
        </View>
      ))}

      {/* Dica Extra */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsIcon}>📚</Text>
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Dica do Dia</Text>
          <Text style={styles.tipsText}>
            Revise seu portfolio mensalmente. Uma boa diversificação reduz riscos e maximiza retornos.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  recCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  recTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  recDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  tipsCard: {
    backgroundColor: colors.primary + '15',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  tipsIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipsText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
});

export default RecommendationsCard;
