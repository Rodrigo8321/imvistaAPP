const fs = require('fs');

function testFundamentusExtraction() {
  console.log('🔍 Testing Fundamentus extraction with real HTML structure...\n');

  // Ler o HTML salvo
  const html = fs.readFileSync('fundamentus_bbse3.html', 'utf8');

  // Função de extração baseada no código atual
  const extractValue = (html, label) => {
    // Estratégia 1: Padrão original
    let regex = new RegExp(`<td[^>]*class="label"[^>]*>\\s*${label}\\s*<\\/td>\\s*<td[^>]*class="data"[^>]*>\\s*([^<]+)\\s*<\\/td>`, 'i');
    let match = html.match(regex);
    if (match) return match[1].trim();

    // Estratégia 2: Padrão alternativo (span dentro de td)
    regex = new RegExp(`<td[^>]*class="label"[^>]*>\\s*<span[^>]*>\\s*${label}\\s*<\\/span>\\s*<\\/td>\\s*<td[^>]*class="data"[^>]*>\\s*<span[^>]*>\\s*([^<]+)\\s*<\\/span>\\s*<\\/td>`, 'i');
    match = html.match(regex);
    if (match) return match[1].trim();

    // Estratégia 3: Busca mais flexível
    regex = new RegExp(`${label}[^>]*>.*?([0-9.,%-]+)`, 'i');
    match = html.match(regex);
    if (match) return match[1].trim();

    return null;
  };

  // Testar extração dos indicadores principais
  const indicators = {
    'P/L': 'P/L',
    'P/VP': 'P/VP',
    'ROE': 'ROE',
    'Div. Yield': 'Div\\. Yield',
    'Marg. Líq.': 'Marg\\. L[ií]q\\.',
    'LPA': 'LPA',
    'VPA': 'VPA'
  };

  console.log('📊 Testing extraction for each indicator:');
  for (const [name, pattern] of Object.entries(indicators)) {
    const extracted = extractValue(html, pattern);
    console.log(`${name}: "${extracted}"`);

    // Mostrar contexto se encontrou
    if (extracted) {
      const contextRegex = new RegExp(`.{0,50}${pattern}.{0,50}`, 'i');
      const contextMatch = html.match(contextRegex);
      if (contextMatch) {
        console.log(`  Context: ...${contextMatch[0]}...`);
      }
    }
  }

  // Testar abordagem direta baseada na estrutura HTML real
  console.log('\n🔧 Testing direct extraction from HTML structure:');

  // Procurar pela linha que contém ROE
  const roeRowRegex = /<tr>[\s\S]*?ROE[\s\S]*?<\/tr>/i;
  const roeRowMatch = html.match(roeRowRegex);
  if (roeRowMatch) {
    console.log('ROE Row found:', roeRowMatch[0].substring(0, 200) + '...');

    // Extrair valor da ROE da linha
    const roeValueRegex = /<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/g;
    const roeValues = [];
    let match;
    while ((match = roeValueRegex.exec(roeRowMatch[0])) !== null) {
      roeValues.push(match[1]);
    }
    console.log('ROE values found in row:', roeValues);
  }

  // Testar para P/L
  const plRowRegex = /<tr>[\s\S]*?P\/L[\s\S]*?<\/tr>/i;
  const plRowMatch = html.match(plRowRegex);
  if (plRowMatch) {
    console.log('P/L Row found:', plRowMatch[0].substring(0, 200) + '...');

    const plValueRegex = /<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/g;
    const plValues = [];
    let match;
    while ((match = plValueRegex.exec(plRowMatch[0])) !== null) {
      plValues.push(match[1]);
    }
    console.log('P/L values found in row:', plValues);
  }
}

testFundamentusExtraction();
