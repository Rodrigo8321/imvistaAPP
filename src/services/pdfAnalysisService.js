import * as FileSystem from 'expo-file-system';

class PDFAnalysisService {
  /**
   * Simula extração de texto de um arquivo PDF (implementação simplificada)
   * @param {string} uri - URI do arquivo PDF
   * @returns {Promise<{text: string, textLength: number, wordCount: number}>}
   */
  async extractTextFromPDF(uri) {
    try {
      // Verificar se o arquivo existe
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Arquivo PDF não encontrado');
      }

      // Para esta implementação simplificada, vamos simular a extração de texto
      // Em um ambiente de produção, seria necessário usar uma biblioteca compatível com React Native
      // como react-native-pdf ou uma solução baseada em API

      // Simular processamento com delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Texto de exemplo baseado em um relatório financeiro típico
      const mockText = `
        RELATÓRIO FINANCEIRO - PETROBRAS
        Demonstração de Resultados do Exercício 2023

        A PETROBRAS apresentou um crescimento significativo em 2023,
        com receita líquida de R$ 500 bilhões, representando um aumento de 15%
        em relação ao ano anterior.

        O lucro líquido atingiu R$ 45 bilhões, com margem de 9%.
        Os investimentos em exploração totalizaram R$ 25 bilhões.

        Projeções para 2024 indicam continuidade do crescimento,
        com expectativa de receita de R$ 550 bilhões.

        PETR4 - Preço atual: R$ 35,50
        Dividendos pagos: R$ 8,50 por ação
      `;

      const textLength = mockText.length;
      const wordCount = mockText.split(/\s+/).filter(word => word.length > 0).length;

      return {
        text: mockText,
        textLength,
        wordCount,
      };
    } catch (error) {
      console.error('Erro ao processar PDF:', error);
      throw new Error('Não foi possível processar o arquivo PDF');
    }
  }

  /**
   * Analisa o conteúdo do texto extraído do PDF
   * @param {string} text - Texto extraído do PDF
   * @returns {Object} Resultado da análise
   */
  analyzePDFContent(text) {
    const analysis = {
      documentType: this.identifyDocumentType(text),
      ticker: this.extractTicker(text),
      sentiment: this.analyzeSentiment(text),
      financialInfo: {
        currencyValues: this.extractCurrencyValues(text),
        percentages: this.extractPercentages(text),
        years: this.extractYears(text),
      },
    };

    return analysis;
  }

  /**
   * Identifica o tipo de documento baseado no conteúdo
   * @param {string} text - Texto do documento
   * @returns {string} Tipo de documento identificado
   */
  identifyDocumentType(text) {
    const upperText = text.toUpperCase();

    if (upperText.includes('BALANÇO') || upperText.includes('BALANCE SHEET')) {
      return 'Balanço Patrimonial';
    }
    if (upperText.includes('DRE') || upperText.includes('DEMONSTRATIVO') || upperText.includes('INCOME STATEMENT')) {
      return 'Demonstrativo de Resultados';
    }
    if (upperText.includes('FLUXO') || upperText.includes('CASH FLOW')) {
      return 'Demonstrativo de Fluxo de Caixa';
    }
    if (upperText.includes('RELATÓRIO') || upperText.includes('REPORT')) {
      return 'Relatório Anual';
    }
    if (upperText.includes('ANÁLISE') || upperText.includes('ANALYSIS')) {
      return 'Análise de Mercado';
    }

    return 'Documento Financeiro';
  }

  /**
   * Extrai ticker/código do ativo do texto
   * @param {string} text - Texto do documento
   * @returns {string|null} Ticker identificado ou null
   */
  extractTicker(text) {
    // Padrões comuns de tickers brasileiros
    const tickerPatterns = [
      /\b([A-Z]{4}\d{1,2})\b/g, // PETR4, VALE3, etc.
      /\b([A-Z]{5,})\b/g, // Outros códigos
    ];

    for (const pattern of tickerPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Filtrar tickers válidos (4+ letras + opcional número)
        const validTickers = matches.filter(ticker =>
          /^[A-Z]{4,}[0-9]*$/.test(ticker) && ticker.length >= 4
        );
        if (validTickers.length > 0) {
          return validTickers[0];
        }
      }
    }

    return null;
  }

  /**
   * Analisa o sentimento do texto
   * @param {string} text - Texto do documento
   * @returns {string} Sentimento (POSITIVO/NEGATIVO/NEUTRO)
   */
  analyzeSentiment(text) {
    const upperText = text.toUpperCase();

    const positiveWords = [
      'CRESCIMENTO', 'AUMENTO', 'GANHO', 'LUCRO', 'PROFIT', 'POSITIVO',
      'MELHORIA', 'AVANÇO', 'SUCESSO', 'OPORTUNIDADE', 'VANTAGEM',
      'FORTALECIMENTO', 'EXPANSÃO', 'DESENVOLVIMENTO', 'INOVAÇÃO'
    ];

    const negativeWords = [
      'QUEDA', 'PERDA', 'DÉFICIT', 'CRISE', 'PROBLEMA', 'DIFICULDADE',
      'REDUÇÃO', 'DECRESCIMENTO', 'PREJUÍZO', 'RISCO', 'AMEAÇA',
      'CONTRAÇÃO', 'RECESSÃO', 'FALÊNCIA', 'ENDIVIDAMENTO'
    ];

    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      const count = (upperText.match(new RegExp(word, 'g')) || []).length;
      positiveScore += count;
    });

    negativeWords.forEach(word => {
      const count = (upperText.match(new RegExp(word, 'g')) || []).length;
      negativeScore += count;
    });

    if (positiveScore > negativeScore) {
      return 'POSITIVO';
    } else if (negativeScore > positiveScore) {
      return 'NEGATIVO';
    } else {
      return 'NEUTRO';
    }
  }

  /**
   * Extrai valores monetários do texto
   * @param {string} text - Texto do documento
   * @returns {string[]} Array de valores monetários encontrados
   */
  extractCurrencyValues(text) {
    // Padrões para valores monetários brasileiros
    const currencyPatterns = [
      /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|bilhões?|trilhões?))?/gi,
      /[\d.,]+\s*(?:mil|milhões?|bilhões?|trilhões?)\s*R\$/gi,
      /R\$\s*[\d.,]+/gi,
      /\b\d{1,3}(?:\.\d{3})*,\d{2}\b/g, // Valores como 1.234.567,89
    ];

    const values = new Set();

    currencyPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Limpar e formatar o valor
          const cleanValue = match.replace(/\s+/g, ' ').trim();
          if (cleanValue.length > 3) { // Evitar valores muito pequenos
            values.add(cleanValue);
          }
        });
      }
    });

    return Array.from(values).slice(0, 10); // Limitar a 10 valores
  }

  /**
   * Extrai percentuais do texto
   * @param {string} text - Texto do documento
   * @returns {string[]} Array de percentuais encontrados
   */
  extractPercentages(text) {
    const percentagePatterns = [
      /\b\d+(?:[.,]\d+)?\s*%/g,
      /\b\d+(?:[.,]\d+)?\s*pontos?\s*percentuais?/gi,
    ];

    const percentages = new Set();

    percentagePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          percentages.add(match.trim());
        });
      }
    });

    return Array.from(percentages).slice(0, 10); // Limitar a 10 percentuais
  }

  /**
   * Extrai anos mencionados no texto
   * @param {string} text - Texto do documento
   * @returns {number[]} Array de anos encontrados
   */
  extractYears(text) {
    const yearPattern = /\b(19|20)\d{2}\b/g;
    const matches = text.match(yearPattern);

    if (!matches) return [];

    const years = matches
      .map(year => parseInt(year))
      .filter(year => year >= 1900 && year <= 2100) // Filtrar anos válidos
      .filter((year, index, arr) => arr.indexOf(year) === index) // Remover duplicatas
      .sort((a, b) => b - a); // Ordenar decrescente

    return years.slice(0, 5); // Limitar a 5 anos mais recentes
  }

  /**
   * Converte base64 para buffer
   * @param {string} base64 - String base64
   * @returns {ArrayBuffer} Buffer compatível com React Native
   */
  base64ToBuffer(base64) {
    try {
      // Para React Native/Expo, usar uma abordagem mais compatível
      const binaryString = this.base64Decode(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('Erro ao converter base64 para buffer:', error);
      throw new Error('Falha na conversão de dados do PDF');
    }
  }

  /**
   * Decodifica base64 de forma compatível com React Native
   * @param {string} base64 - String base64
   * @returns {string} String binária
   */
  base64Decode(base64) {
    // Usar uma implementação compatível com React Native
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let buffer = '';
    let group = 0;
    let bits = 0;

    for (let i = 0; i < base64.length; i++) {
      const char = base64.charAt(i);
      const index = chars.indexOf(char);

      if (index >= 0) {
        bits = (bits << 6) | index;
        group++;

        if (group === 4) {
          buffer += String.fromCharCode((bits >> 16) & 255);
          buffer += String.fromCharCode((bits >> 8) & 255);
          buffer += String.fromCharCode(bits & 255);
          bits = 0;
          group = 0;
        }
      }
    }

    // Adicionar caracteres restantes
    if (group === 2) {
      buffer += String.fromCharCode((bits >> 4) & 255);
    } else if (group === 3) {
      buffer += String.fromCharCode((bits >> 10) & 255);
      buffer += String.fromCharCode((bits >> 2) & 255);
    }

    return buffer;
  }
}

const pdfAnalysisService = new PDFAnalysisService();
export default pdfAnalysisService;
