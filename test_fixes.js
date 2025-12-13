const { fetchExchangeRate, fetchQuote } = require('./src/services/marketService');

/**
 * Script para testar as principais APIs de cotação e câmbio.
 * Para executar, use: node test_fixes.js
 */
const testAPIs = async () => {
  console.log('\n========== TESTANDO APIs ==========');

  // Teste 1: Taxa de Câmbio
  try {
    console.log('1️⃣ Testando Taxa de Câmbio...');
    const rate = await fetchExchangeRate();
    console.log('✅ Taxa USD/BRL:', rate);
  } catch (error) {
    console.error('❌ Erro na taxa de câmbio:', error.message);
  }

  // Teste 2: Cotação da Brapi
  try {
    console.log('\n2️⃣ Testando Brapi (PETR4)...');
    const asset = { ticker: 'PETR4', type: 'Ação' };
    const quote = await fetchQuote(asset);
    console.log('✅ Cotação PETR4:', quote.price);
  } catch (error) {
    console.error('❌ Erro na cotação PETR4:', error.message);
  }

  console.log('\n===================================\n');
};

// Executa os testes
testAPIs();
