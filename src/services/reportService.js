
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency, formatPercent } from '../utils/formatters';

const generateHtml = (portfolio, stats) => {
  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const assetsRows = portfolio.map(asset => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${asset.ticker}</strong><br/>
        <span style="color: #666; font-size: 12px;">${asset.name || 'Ação'}</span>
      </td>
      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">
        ${asset.quantity}
      </td>
      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">
        ${formatCurrency(asset.averagePrice)}
      </td>
       <td style="text-align: right; padding: 12px; border-bottom: 1px solid #eee;">
        ${formatCurrency(asset.quantity * asset.averagePrice)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 40px; }
          .logo { font-size: 28px; font-weight: bold; color: #6200EE; margin-bottom: 10px; }
          .title { font-size: 24px; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 14px; }
          
          .summary-card {
            background-color: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
          }
          .summary-item { text-align: center; }
          .summary-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
          .summary-value { font-size: 20px; font-weight: bold; margin-top: 5px; color: #000; }
          .value-success { color: #00C853; }
          .value-danger { color: #D50000; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background-color: #f8f9fa; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; }
          
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">InvistaAPP</div>
          <div class="title">Relatório de Portfólio</div>
          <div class="subtitle">Gerado em ${date}</div>
        </div>

        <div class="summary-card">
          <div class="summary-item">
            <div class="summary-label">Patrimônio Investido</div>
            <div class="summary-value">${formatCurrency(stats.totalInvested)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Valor Atual (Est.)</div>
            <div class="summary-value">${formatCurrency(stats.totalCurrent || stats.totalInvested)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Rentabilidade</div>
            <div class="summary-value ${stats.profit >= 0 ? 'value-success' : 'value-danger'}">
              ${stats.profit >= 0 ? '+' : ''}${formatPercent(stats.profitPercent)}
            </div>
          </div>
        </div>

        <h3>Detalhamento de Ativos</h3>
        <table>
          <thead>
            <tr>
              <th>Ativo</th>
              <th style="text-align: right;">Qtd</th>
              <th style="text-align: right;">Preço Médio</th>
              <th style="text-align: right;">Total Pago</th>
            </tr>
          </thead>
          <tbody>
            ${assetsRows}
          </tbody>
        </table>

        <div class="footer">
          <p>Este relatório foi gerado automaticamente pelo InvistaAPP.</p>
        </div>
      </body>
    </html>
  `;
};

export const generateAndSharePortfolioReport = async (portfolio, stats) => {
  try {
    const html = generateHtml(portfolio, stats);
    const { uri } = await Print.printToFileAsync({ html });
    console.log('📄 PDF gerado em:', uri);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      console.log('⚠️ Compartilhamento não disponível');
      return uri;
    }
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw error;
  }
};
