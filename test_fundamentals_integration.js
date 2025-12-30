#!/usr/bin/env node

/**
 * Script de Teste - Integração de Indicadores Fundamentalistas
 *
 * Testa todas as fontes de dados implementadas:
 * - Brapi (primária)
 * - Fundamentus (fallback brasileiro)
 * - Yahoo Finance (fallback global)
 * - Alpha Vantage (fallback internacional)
 *
 * Uso: node test_fundamentals_integration.js
 */

const brapiService = require('./src/services/brapiService').default;
const fundamentusService = require('./src/services/fundamentusService').default;
const yahooFinanceService = require('./src/services/yahooFinanceService').default;
const alphaVantageService = require('./src/services/alphaVantageService').default;

async function testSymbol(symbol, description) {
  console.log(`\n🧪 Testando ${symbol} (${description})`);
  console.log('='.repeat(50));

  try {
    // 1. Testar Brapi Service (integração completa)
    console.log('📊 Testando Brapi Service (fallback automático)...');
    const brapiData = await brapiService.getFundamentals(symbol);
    console.log(`✅ Brapi Result: ROE=${brapiData.returnOnEquity ? (brapiData.returnOnEquity * 100).toFixed(2) + '%' : 'null'}, DY=${brapiData.dividendYield ? (brapiData.dividendYield * 100).toFixed(2) + '%' : 'null'}`);

    // 2. Testar Fundamentus diretamente
    console.log('🌐 Testando Fundamentus Service...');
    const fundamentusData = await fundamentusService.getFundamentals(symbol);
    if (fundamentusData) {
      console.log(`✅ Fundamentus Result: ROE=${fundamentusData.roe}%, DY=${fundamentusData.dividendYield}%`);
    } else {
      console.log('⚠️ Fundamentus: Sem dados');
    }

    // 3. Testar Yahoo Finance
    console.log('💰 Testando Yahoo Finance Service...');
    const yahooData = await yahooFinanceService.getFundamentalData(symbol);
    if (yahooData) {
      console.log(`✅ Yahoo Result: PE=${yahooData.priceEarnings}, DY=${yahooData.dividendYield ? (yahooData.dividendYield * 100).toFixed(2) + '%' : 'null'}`);
    } else {
      console.log('⚠️ Yahoo Finance: Sem dados');
    }

    // 4. Testar Alpha Vantage
    console.log('📈 Testando Alpha Vantage Service...');
    const alphaData = await alphaVantageService.getFundamentalData(symbol);
    if (alphaData) {
      console.log(`✅ Alpha Vantage Result: ROE=${alphaData.returnOnEquity}%, DY=${alphaData.dividendYield}%`);
    } else {
      console.log('⚠️ Alpha Vantage: Sem dados');
    }

  } catch (error) {
    console.error(`❌ Erro testando ${symbol}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Iniciando Teste de Integração - Indicadores Fundamentalistas');
  console.log('Este teste verifica se todas as fontes de dados estão funcionando\n');

  // Testar ações brasileiras
  await testSymbol('BBSE3', 'Banco do Brasil - Ação Brasileira Típica');
  await testSymbol('PETR4', 'Petrobras - Ação Brasileira Grande');
  await testSymbol('VALE3', 'Vale - Ação Brasileira Mining');

  // Testar ações internacionais
  await testSymbol('AAPL', 'Apple Inc - Ação Americana');
  await testSymbol('TSLA', 'Tesla - Ação Americana Tech');

  console.log('\n🎯 Teste Concluído!');
  console.log('Verifique os logs acima para confirmar que:');
  console.log('✅ Pelo menos uma fonte fornece ROE e DY para cada símbolo');
  console.log('✅ O fallback automático está funcionando');
  console.log('✅ Não há erros críticos bloqueando a obtenção de dados');

  process.exit(0);
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSymbol };
