const fs = require('fs');

function testTargetedExtraction() {
  console.log('🎯 Testing targeted Fundamentus extraction...\n');

  // Ler o HTML salvo
  const html = fs.readFileSync('fundamentus_bbse3.html', 'utf8');

  // Encontrar a tabela de indicadores fundamentalistas
  const tableRegex = /<table[^>]*>[\s\S]*?Indicadores fundamentalistas[\s\S]*?<\/table>/i;
  const tableMatch = html.match(tableRegex);

  if (tableMatch) {
    console.log('✅ Found fundamentals table');
    const tableHtml = tableMatch[0];

    // Procurar por todas as linhas da tabela
    const rows = tableHtml.split('<tr>');
    console.log(`Found ${rows.length} rows in fundamentals table`);

    // Procurar linhas que contenham indicadores específicos
    const indicators = ['P/L', 'P/VP', 'ROE', 'Div. Yield', 'LPA', 'VPA'];

    for (const indicator of indicators) {
      // Procurar linha que contenha o indicador
      const indicatorRow = rows.find(row => row.includes(indicator) && row.includes('class="label"'));

      if (indicatorRow) {
        console.log(`\n📊 Found ${indicator} row:`);
        console.log(indicatorRow.substring(0, 300) + '...');

        // Extrair o valor da linha
        const valueMatch = indicatorRow.match(/<td[^>]*class="data[^"]*"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/);
        if (valueMatch) {
          console.log(`✅ ${indicator}: ${valueMatch[1].trim()}`);
        } else {
          console.log(`❌ ${indicator}: Value not found in row`);
        }
      } else {
        console.log(`❌ ${indicator}: Row not found`);
      }
    }

  } else {
    console.log('❌ Fundamentals table not found');
  }
}

testTargetedExtraction();
