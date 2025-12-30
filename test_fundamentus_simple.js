const fs = require('fs');

function testFundamentusValues() {
  console.log('🔍 Testing Fundamentus HTML for known values...\n');

  // Ler o HTML salvo
  const html = fs.readFileSync('fundamentus_bbse3.html', 'utf8');

  // Valores conhecidos que devem estar presentes
  const expectedValues = {
    'P/L': '8,02',
    'P/VP': '5,61',
    'ROE': '69,9%',
    'Div. Yield': '11,8%',
    'LPA': '4,50',
    'VPA': '6,43'
  };

  console.log('📊 Checking for expected values:');
  for (const [label, value] of Object.entries(expectedValues)) {
    const found = html.includes(value);
    console.log(`${label}: ${value} - ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
  }

  console.log('\n🔧 Testing simple extraction patterns:');

  // Testar padrões simples de regex
  const patterns = {
    'P/L': /P\/L[^>]*>[^<]*([0-9]+,[0-9]+)/i,
    'ROE': /ROE[^>]*>[^<]*([0-9]+,[0-9]+)%/i,
    'Div. Yield': /Div\. Yield[^>]*>[^<]*([0-9]+,[0-9]+)%/i,
    'P/VP': /P\/VP[^>]*>[^<]*([0-9]+,[0-9]+)/i,
    'LPA': /LPA[^>]*>[^<]*([0-9]+,[0-9]+)/i,
    'VPA': /VPA[^>]*>[^<]*([0-9]+,[0-9]+)/i
  };

  for (const [label, pattern] of Object.entries(patterns)) {
    const match = html.match(pattern);
    console.log(`${label}: ${match ? match[1] : 'NOT FOUND'}`);
  }
}

testFundamentusValues();
