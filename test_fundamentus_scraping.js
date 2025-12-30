// Script para testar apenas o scraping do Fundamentus
const fetch = require('node-fetch');

class TestFundamentusService {
  parseValue(valueStr) {
    if (!valueStr || valueStr === '-' || valueStr === 'N/A') return null;
    const cleaned = valueStr.trim().replace(/\./g, '').replace(',', '.');
    const withoutPercent = cleaned.replace('%', '');
    const num = parseFloat(withoutPercent);
    return isNaN(num) ? null : num;
  }

  extractValue(html, label) {
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
  }

  async testFundamentus(ticker) {
    console.log(`🌐 Testing Fundamentus scraping for ${ticker}...`);

    try {
      const url = `https://fundamentus.com.br/detalhes.php?papel=${ticker}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Fundamentus returned status ${response.status} for ${ticker}`);
        return null;
      }

      const html = await response.text();
      console.log(`📄 Fundamentus HTML length: ${html.length}`);

      // Verificar se o ticker existe
      if (html.includes('não encontrado') || html.includes('Não encontrado') || html.includes('404')) {
        console.warn(`⚠️ Ticker ${ticker} not found in Fundamentus`);
        return null;
      }

      // Extrair dados
      const fundamentals = {};

      // Valuation
      fundamentals.pl = this.parseValue(this.extractValue(html, 'P/L') || this.extractValue(html, 'P\\.L') || this.extractValue(html, 'PL'));
      fundamentals.pvp = this.parseValue(this.extractValue(html, 'P/VP') || this.extractValue(html, 'P\\.VP') || this.extractValue(html, 'PVP'));

      // Rentabilidade
      fundamentals.roe = this.parseValue(this.extractValue(html, 'ROE'));
      fundamentals.roic = this.parseValue(this.extractValue(html, 'ROIC'));

      // Dividendos
      fundamentals.dividendYield = this.parseValue(this.extractValue(html, 'Div\\. Yield') || this.extractValue(html, 'Dividend Yield') || this.extractValue(html, 'DY'));

      // Outros
      fundamentals.vpa = this.parseValue(this.extractValue(html, 'VPA'));
      fundamentals.lpa = this.parseValue(this.extractValue(html, 'LPA'));

      console.log(`🔍 Extraction results for ${ticker}:`, {
        pl: fundamentals.pl,
        pvp: fundamentals.pvp,
        roe: fundamentals.roe,
        dy: fundamentals.dividendYield,
        vpa: fundamentals.vpa,
        lpa: fundamentals.lpa
      });

      // Verificar se conseguimos dados essenciais
      const hasEssentialData = fundamentals.roe !== null || fundamentals.dividendYield !== null || fundamentals.pl !== null;

      if (hasEssentialData) {
        console.log(`✅ SUCCESS: Got essential data for ${ticker}`);
        return fundamentals;
      } else {
        console.log(`❌ FAILED: No essential data extracted for ${ticker}`);
        return null;
      }

    } catch (error) {
      console.error(`❌ Error testing Fundamentus for ${ticker}:`, error.message);
      return null;
    }
  }
}

async function runTest() {
  const service = new TestFundamentusService();
  await service.testFundamentus('BBSE3');
}

runTest();
