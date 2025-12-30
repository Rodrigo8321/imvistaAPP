const alphaVantageService = require('./src/services/alphaVantageService.js').default;

async function testAlphaVantage() {
  console.log('🧪 Testing Alpha Vantage Service...');

  // Test symbol formatting
  console.log('Testing symbol formatting:');
  console.log('PETR4 ->', alphaVantageService.formatSymbol('PETR4'));
  console.log('VALE3 ->', alphaVantageService.formatSymbol('VALE3'));
  console.log('AAPL ->', alphaVantageService.formatSymbol('AAPL'));
  console.log('MSFT ->', alphaVantageService.formatSymbol('MSFT'));

  // Test API call for Brazilian stock
  console.log('\nTesting API call for PETR4...');
  try {
    const data = await alphaVantageService.getFundamentalData('PETR4');
    if (data) {
      console.log('✅ Success! Data received:', {
        pe: data.priceEarnings,
        roe: data.returnOnEquity,
        dy: data.dividendYield,
        sector: data.sector,
        source: data.source
      });
    } else {
      console.log('❌ No data received for PETR4');
    }
  } catch (error) {
    console.error('❌ Error testing PETR4:', error.message);
  }

  // Test API call for international stock
  console.log('\nTesting API call for AAPL...');
  try {
    const data = await alphaVantageService.getFundamentalData('AAPL');
    if (data) {
      console.log('✅ Success! Data received:', {
        pe: data.priceEarnings,
        roe: data.returnOnEquity,
        dy: data.dividendYield,
        sector: data.sector,
        source: data.source
      });
    } else {
      console.log('❌ No data received for AAPL');
    }
  } catch (error) {
    console.error('❌ Error testing AAPL:', error.message);
  }
}

testAlphaVantage().catch(console.error);
