const fs = require('fs');

function debugFundamentusHTML() {
  console.log('🔍 Debugging Fundamentus HTML structure...\n');

  // Ler o HTML salvo
  const html = fs.readFileSync('fundamentus_bbse3.html', 'utf8');
  console.log(`📄 HTML length: ${html.length}`);

  // Procurar pela tabela de indicadores fundamentalistas
  const tableRegex = /<table[^>]*>[\s\S]*?Indicadores fundamentalistas[\s\S]*?<\/table>/i;
  const tableMatch = html.match(tableRegex);

  if (tableMatch) {
    console.log('✅ Found fundamentals table');
    const tableHtml = tableMatch[0];

    // Procurar por P/L
    const plRegex = /<span[^>]*class="txt"[^>]*>\s*P\/L\s*<\/span>[\s\S]*?<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const plMatch = tableHtml.match(plRegex);
    console.log('P/L match:', plMatch ? plMatch[1] : 'NOT FOUND');

    // Procurar por ROE
    const roeRegex = /<span[^>]*class="txt"[^>]*>\s*ROE\s*<\/span>[\s\S]*?<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const roeMatch = tableHtml.match(roeRegex);
    console.log('ROE match:', roeMatch ? roeMatch[1] : 'NOT FOUND');

    // Procurar por Div. Yield
    const dyRegex = /<span[^>]*class="txt"[^>]*>\s*Div\. Yield\s*<\/span>[\s\S]*?<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const dyMatch = tableHtml.match(dyRegex);
    console.log('Div. Yield match:', dyMatch ? dyMatch[1] : 'NOT FOUND');

    // Procurar por P/VP
    const pvpRegex = /<span[^>]*class="txt"[^>]*>\s*P\/VP\s*<\/span>[\s\S]*?<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const pvpMatch = tableHtml.match(pvpRegex);
    console.log('P/VP match:', pvpMatch ? pvpMatch[1] : 'NOT FOUND');

    // Procurar por LPA
    const lpaRegex = /<span[^>]*class="txt"[^>]*>\s*LPA\s*<\/span>[\s\S]*?<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const lpaMatch = tableHtml.match(lpaRegex);
    console.log('LPA match:', lpaMatch ? lpaMatch[1] : 'NOT FOUND');

    // Procurar por VPA
    const vpaRegex = /<span[^>]*class="txt"[^>]*>\s*VPA\s*<\/span>[\s\S]*?<td[^>]*class="data"[^>]*>[\s\S]*?<span[^>]*class="txt"[^>]*>([^<]+)<\/span>/i;
    const vpaMatch = tableHtml.match(vpaRegex);
    console.log('VPA match:', vpaMatch ? vpaMatch[1] : 'NOT FOUND');

  } else {
    console.log('❌ Fundamentals table not found');
  }

  // Testar regex mais simples
  console.log('\n🔧 Testing simpler regex patterns...');

  const simplePlRegex = /P\/L[^>]*>.*?([0-9.,-]+)/i;
  const simplePlMatch = html.match(simplePlRegex);
  console.log('Simple P/L:', simplePlMatch ? simplePlMatch[1] : 'NOT FOUND');

  const simpleRoeRegex = /ROE[^>]*>.*?([0-9.,%-]+)/i;
  const simpleRoeMatch = html.match(simpleRoeRegex);
  console.log('Simple ROE:', simpleRoeMatch ? simpleRoeMatch[1] : 'NOT FOUND');

  const simpleDyRegex = /Div\. Yield[^>]*>.*?([0-9.,%-]+)/i;
  const simpleDyMatch = html.match(simpleDyRegex);
  console.log('Simple Div. Yield:', simpleDyMatch ? simpleDyMatch[1] : 'NOT FOUND');
}

debugFundamentusHTML();
