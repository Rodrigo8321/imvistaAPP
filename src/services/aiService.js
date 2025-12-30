import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_CONFIG } from '../config/apiConfig';
import * as FileSystem from 'expo-file-system';

const genAI = new GoogleGenerativeAI(API_CONFIG.gemini.apiKey);

/**
 * Converte um arquivo local para Base64 para envio à API do Gemini
 */
const fileToGenerativePart = async (uri, mimeType) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      inlineData: {
        data: base64,
        mimeType
      },
    };
  } catch (error) {
    console.error('[AI Service] Erro ao converter arquivo:', error);
    throw error;
  }
};

/**
 * Analisa um ativo usando dados de mercado e opcionalmente um PDF
 */
export const analyzeAssetWithIA = async (symbol, marketData, pdfUri = null) => {
  try {
    if (!API_CONFIG.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY não configurada no arquivo .env');
    }

    const model = genAI.getGenerativeModel({ model: API_CONFIG.gemini.model });

    const prompt = `
Você é um analista de investimentos profissional sênior com foco em análise fundamentalista. 
Sua tarefa é analisar o ativo ${symbol} com base nos dados fornecidos e gerar um relatório estruturado.

DADOS DE MERCADO ATUAIS:
${JSON.stringify(marketData, null, 2)}

INSTRUÇÕES DE FORMATO:
Retorne os dados EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "recommendation": "Compra" | "Venda" | "Manutenção",
  "summary": "Resumo executivo de 2-3 frases",
  "categories": {
    "rentabilidade": { "score": 0-10, "analysis": "Texto de análise" },
    "endividamento": { "score": 0-10, "analysis": "Texto de análise" },
    "valuation": { "score": 0-10, "analysis": "Texto de análise" },
    "proventos": { "score": 0-10, "analysis": "Texto de análise" },
    "crescimento": { "score": 0-10, "analysis": "Texto de análise" }
  },
  "comparative": [
    { "metric": "P/L", "value": "X", "average": "Y", "status": "Acima/Abaixo/Em linha" },
    ...
  ]
}

Se um PDF for fornecido, extraia as informações mais recentes do balanço ou fatos relevantes para complementar a análise.
Analise com rigor técnico, considerando KPIs como ROE, Dívida Líquida/EBITDA, P/L, DY e P/VP.
`;

    let result;
    if (pdfUri) {
      const pdfPart = await fileToGenerativePart(pdfUri, 'application/pdf');
      result = await model.generateContent([prompt, pdfPart]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();
    console.log('[AI Service] Resposta bruta da IA:', text);

    // Tenta extrair o JSON se a IA tiver colocado texto extra
    let jsonString = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[AI Service] Erro ao parsear JSON da IA. Texto recebido:', text);
      throw new Error('A resposta da IA não está em um formato válido. Tente novamente.');
    }
  } catch (error) {
    console.error('[AI Service] Erro na análise IA:', error);
    throw error;
  }
};
