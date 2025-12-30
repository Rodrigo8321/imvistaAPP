const fs = require('fs');

function debugFundamentusStructure() {
  console.log('🔍 Debugging Fundamentus HTML structure in detail...\n');

  // Ler o HTML salvo
  const html = fs.readFileSync('fundamentus_bbse3.html', 'utf8');

  // Procurar pela tabela de indicadores fundamentalistas
  const tableRegex = /<table[^>]*>[\s\S]*?Indicadores fundamentalistas[\s\S]*?<\/table>/i;
  const tableMatch = html.match(tableRegex);

  if (tableMatch) {
    console.log('✅ Found fundamentals table');
    const tableHtml = tableMatch[0];

    // Procurar por linhas que contenham os indicadores
    const rows = tableHtml.split('<tr>');
    console.log(`Found ${rows.length} rows in fundamentals table`);

    // Procurar por linhas específicas
    const plRow = rows.find(row => row.includes('P/L'));
    if (plRow) {
      console.log('\n📊 P/L Row:');
      console.log(plRow.substring(0, 500));

      // Procurar pelo valor específico
      const plValueMatch = plRow.match(/<td[^>]*class="data[^"]*"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i);
      console.log('P/L value match:', plValueMatch ? plValueMatch[1] : 'NOT FOUND');
    }

    const roeRow = rows.find(row => row.includes('ROE'));
    if (roeRow) {
      console.log('\n📊 ROE Row:');
      console.log(roeRow.substring(0, 500));

      const roeValueMatch = roeRow.match(/<td[^>]*class="data[^"]*"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i);
      console.log('ROE value match:', roeValueMatch ? roeValueMatch[1] : 'NOT FOUND');
    }

    const dyRow = rows.find(row => row.includes('Div. Yield'));
    if (dyRow) {
      console.log('\n📊 Div. Yield Row:');
      console.log(dyRow.substring(0, 500));

      const dyValueMatch = dyRow.match(/<td[^>]*class="data[^"]*"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i);
      console.log('Div. Yield value match:', dyValueMatch ? dyValueMatch[1] : 'NOT FOUND');
    }

    // Testar abordagem mais simples - procurar valores diretamente após os labels
    console.log('\n🔧 Testing direct value extraction:');

    const directPlMatch = tableHtml.match(/P\/L[\s\S]*?8,02/i);
    console.log('Direct P/L 8,02:', directPlMatch ? 'FOUND' : 'NOT FOUND');

    const directRoeMatch = tableHtml.match(/ROE[\s\S]*?69,9%/i);
    console.log('Direct ROE 69,9%:', directRoeMatch ? 'FOUND' : 'NOT FOUND');

    const directDyMatch = tableHtml.match(/Div\. Yield[\s\S]*?11,8%/i);
    console.log('Direct Div. Yield 11,8%:', directDyMatch ? 'FOUND' : 'NOT FOUND');

  } else {
    console.log('❌ Fundamentals table not found');
  }
}

debugFundamentusStructure();
