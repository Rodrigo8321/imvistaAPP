// Script simples para testar os fallbacks de fundamentos
const brapiService = require('./src/services/brapiService').default;

async function testFundamentals() {
  console.log('🧪 Testing fundamentals fallback for BBSE3...');

  try {
    const fundamentals = await brapiService.getFundamentals('BBSE3');

    console.log('📊 Result:', {
      roe: fundamentals.returnOnEquity,
      dy: fundamentals.dividendYield,
      pe: fundamentals.priceEarnings,
      pvp: fundamentals.priceToBook,
      source: fundamentals.source || 'unknown'
    });

    if (fundamentals.returnOnEquity && fundamentals.dividendYield) {
      console.log('✅ SUCCESS: Got essential data (ROE and DY)');
    } else {
      console.log('❌ FAILED: Missing essential data');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFundamentals();
