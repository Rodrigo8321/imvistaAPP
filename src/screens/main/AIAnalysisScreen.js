import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import colors from '../../styles/colors';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { analyzeAssetWithIA } from '../../services/aiService';
import { fetchQuote } from '../../services/marketService';
import brapi from '../../services/brapiService';
import pdfAnalysisService from '../../services/pdfAnalysisService';

const AIAnalysisScreen = () => {
  const [assetCode, setAssetCode] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { portfolio } = usePortfolio();

  const handleAnalyzeAsset = async () => {
    if (!assetCode.trim()) {
      Alert.alert('Erro', 'Digite o código do ativo');
      return;
    }

    setLoading(true);
    try {
      const quote = await fetchQuote(assetCode.toUpperCase());
      if (!quote) {
        Alert.alert('Erro', 'Ativo não encontrado');
        return;
      }

      const result = await analyzeAssetWithIA(assetCode.toUpperCase(), portfolio);
      setAnalysis(result);
    } catch (error) {
      console.error('Erro na análise:', error);
      Alert.alert('Erro', 'Não foi possível analisar o ativo');
    } finally {
      setLoading(false);
    }
  };

  const handlePDFAnalysis = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setPdfLoading(true);
        try {
          const extractedData = await pdfAnalysisService.extractTextFromPDF(result.uri);
          const analysisResult = pdfAnalysisService.analyzePDFContent(extractedData.text);
          setPdfAnalysis({
            ...extractedData,
            ...analysisResult,
          });
        } catch (error) {
          console.error('Erro na análise do PDF:', error);
          Alert.alert('Erro', 'Não foi possível analisar o PDF. Verifique se o arquivo é válido.');
        } finally {
          setPdfLoading(false);
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar PDF:', error);
      Alert.alert('Erro', 'Não foi possível selecionar o arquivo PDF');
    }
  };

  const renderPDFAnalysisResults = () => {
    if (!pdfAnalysis) return null;

    return (
      <View style={styles.pdfResultsContainer}>
        <Text style={styles.sectionTitle}>Análise do Relatório PDF</Text>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Tipo de Documento:</Text>
          <Text style={styles.resultValue}>{pdfAnalysis.documentType}</Text>
        </View>

        {pdfAnalysis.ticker && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Ticker Identificado:</Text>
            <Text style={styles.resultValue}>{pdfAnalysis.ticker}</Text>
          </View>
        )}

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Sentimento:</Text>
          <Text style={[styles.resultValue, {
            color: pdfAnalysis.sentiment === 'POSITIVO' ? '#4CAF50' :
                   pdfAnalysis.sentiment === 'NEGATIVO' ? '#F44336' : '#FF9800'
          }]}>
            {pdfAnalysis.sentiment}
          </Text>
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.resultLabel}>Estatísticas:</Text>
          <Text style={styles.resultValue}>
            {pdfAnalysis.wordCount} palavras, {pdfAnalysis.textLength} caracteres
          </Text>
        </View>

        {pdfAnalysis.financialInfo.currencyValues && pdfAnalysis.financialInfo.currencyValues.length > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Valores Monetários:</Text>
            <Text style={styles.resultValue}>
              {pdfAnalysis.financialInfo.currencyValues.slice(0, 5).join(', ')}
              {pdfAnalysis.financialInfo.currencyValues.length > 5 && '...'}
            </Text>
          </View>
        )}

        {pdfAnalysis.financialInfo.percentages && pdfAnalysis.financialInfo.percentages.length > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Percentuais:</Text>
            <Text style={styles.resultValue}>
              {pdfAnalysis.financialInfo.percentages.slice(0, 5).join(', ')}
              {pdfAnalysis.financialInfo.percentages.length > 5 && '...'}
            </Text>
          </View>
        )}

        {pdfAnalysis.financialInfo.years && pdfAnalysis.financialInfo.years.length > 0 && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Anos Mencionados:</Text>
            <Text style={styles.resultValue}>
              {pdfAnalysis.financialInfo.years.join(', ')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Análise com IA</Text>
          <Text style={styles.subtitle}>Analise ativos e relatórios usando inteligência artificial</Text>
        </View>

        {/* Análise de Ativos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análise de Ativos</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Digite o código do ativo (ex: PETR4)"
              value={assetCode}
              onChangeText={setAssetCode}
              autoCapitalize="characters"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAnalyzeAsset}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="analytics" size={20} color="white" />
                <Text style={styles.buttonText}>Analisar Ativo</Text>
              </>
            )}
          </TouchableOpacity>

          {analysis && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>{analysis}</Text>
            </View>
          )}
        </View>

        {/* Análise de PDF */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Análise de Relatórios em PDF</Text>
          <Text style={styles.sectionDescription}>
            Faça upload de relatórios financeiros em PDF para análise automática
          </Text>

          <TouchableOpacity
            style={[styles.pdfButton, pdfLoading && styles.buttonDisabled]}
            onPress={handlePDFAnalysis}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="document" size={20} color="white" />
                <Text style={styles.buttonText}>Selecionar PDF</Text>
              </>
            )}
          </TouchableOpacity>

          {renderPDFAnalysisResults()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  button: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  pdfButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  pdfResultsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'bold',
    flex: 1,
  },
  resultValue: {
    fontSize: 14,
    color: colors.text,
    flex: 2,
    textAlign: 'right',
  },
});

export default AIAnalysisScreen;
