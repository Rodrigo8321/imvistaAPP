const fs = require('fs');

function testFinalExtraction() {
  console.log('🔬 Final test of Fundamentus extraction...\n');

  // Ler o HTML salvo
  const html = fs.readFileSync('fundamentus_bbse3.html', 'utf8');

  // Encontrar a tabela de indicadores fundamentalistas
  const tableRegex = /<table[^>]*>[\s\S]*?Indicadores fundamentalistas[\s\S]*?<\/table>/i;
  const tableMatch = html.match(tableRegex);

  if (tableMatch) {
    console.log('✅ Found fundamentals table');
    const tableHtml = tableMatch[0];

    // Mostrar uma amostra da tabela para análise
    console.log('📋 Table sample (first 1000 chars):');
    console.log(tableHtml.substring(0, 1000) + '...');

    // Procurar por padrões específicos
    console.log('\n🔍 Searching for specific patterns:');

    // P/L pattern
    const plPattern = /P\/L[\s\S]*?<td[^>]*class="data[^"]*"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const plMatch = tableHtml.match(plPattern);
    console.log('P/L match:', plMatch ? plMatch[1] : 'Not found');

    // ROE pattern
    const roePattern = /ROE[\s\S]*?<td[^>]*class="data[^"]*"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const roeMatch = tableHtml.match(roePattern);
    console.log('ROE match:', roeMatch ? roeMatch[1] : 'Not found');

    // Alternative: procurar todas as ocorrências de span class="txt" na tabela
    const allSpans = tableHtml.match(/<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/g);
    if (allSpans) {
      console.log('\n📊 All txt spans in fundamentals table:');
      allSpans.slice(0, 20).forEach((span, i) => {
        const value = span.match(/<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/)[1];
        console.log(`${i + 1}: "${value.trim()}"`);
      });
    }

  } else {
    console.log('❌ Fundamentals table not found');
  }
}

testFinalExtraction();
