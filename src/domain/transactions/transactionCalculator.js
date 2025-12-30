/**
 * Calcula totais de transações
 * @param {Array} transactions - Array de transações
 * @returns {Object} Objeto com totais
 */
export function calculateTotals(transactions) {
  let totalBought = 0;
  let totalSold = 0;
  let totalProfit = 0;
  let realizedProfitFromSales = 0; // Rastreia o lucro apenas das vendas

  transactions.forEach(transaction => {
    const total = transaction.quantity * transaction.unitPrice;

    if (transaction.type === 'Compra') {
      totalBought += total;
    } else if (transaction.type === 'Venda') {
      totalSold += total;
      realizedProfitFromSales += transaction.profit || 0; // Acumula o lucro das vendas
    }
  });

  // O lucro total agora é a soma do lucro realizado com as vendas
  // mais a diferença entre o valor atual e o custo dos ativos restantes.
  // Esta lógica foi movida para as telas (Dashboard/Portfolio) que têm
  // acesso aos preços atuais para um cálculo mais preciso.
  totalProfit = realizedProfitFromSales;

  const profitPercent = totalBought > 0 ? (totalProfit / totalBought) * 100 : 0;

  return {
    totalBought,
    totalSold,
    totalProfit,
    profitPercent,
  };
}

/**
 * Calcula o estado do portfólio a partir de uma lista de transações.
 * @param {Array} transactions - Array de todas as transações.
 * @returns {Array} Um array de ativos que representa o portfólio.
 */
export function calculatePortfolioFromTransactions(transactions) {
  const portfolioMap = new Map();

  // Ordena as transações por data para garantir a ordem correta dos cálculos
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  // Adiciona log para depurar tickers com espaços extras
  console.log('🔍 Símbolos originais nas transações:', sortedTransactions.map(t => `"${t.ticker}"`));

  // Helper para converter valores numéricos com segurança (suporta vírgula e string)
  const safeFloat = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const standardized = value.replace(',', '.');
      const number = parseFloat(standardized);
      return isNaN(number) ? 0 : number;
    }
    return 0;
  };

  sortedTransactions.forEach(tx => {
    // Limpa o ticker para remover espaços, aspas e garantir consistência
    const cleanTicker = tx.ticker.replace(/['"]/g, '').trim().toUpperCase();

    // Parse seguro de quantidade e preço
    const quantity = safeFloat(tx.quantity);
    // Para ativos adicionados manualmente (não transações de compra/venda explícitas),
    // o valor pode estar em averagePrice em vez de unitPrice.
    const unitPrice = safeFloat(tx.unitPrice) || safeFloat(tx.averagePrice);

    // Inferir moeda baseada no país se não estiver definida
    let currency = tx.currency;
    if (!currency) {
      if (tx.country === '🇺🇸' || tx.country === 'USA') {
        currency = 'USD';
      } else {
        currency = 'BRL';
      }
    }

    if (!portfolioMap.has(cleanTicker)) {
      // Se o ativo não existe no mapa, inicializa com dados da primeira transação
      // Isso é importante para carregar metadados como nome, tipo, setor, etc.
      portfolioMap.set(cleanTicker, {
        id: cleanTicker, // Usar ticker como ID único para o ativo no portfólio
        ticker: cleanTicker,
        name: tx.name,
        type: tx.typeAsset || 'Ação', // Garante que o tipo nunca seja indefinido
        sector: tx.sector,
        country: tx.country,
        currency: currency,
        quantity: 0,
        averagePrice: 0,
        totalInvested: 0,
        currentPrice: unitPrice, // Preço inicial, será atualizado por APIs externas
      });
    }

    const asset = portfolioMap.get(cleanTicker);

    if (tx.type === 'Compra') {
      const addedValue = quantity * unitPrice;
      const newTotalInvested = asset.totalInvested + addedValue;

      console.log(`[CALC] ${cleanTicker} COMPRA: Qtd ${quantity} x Preço R$ ${unitPrice} = Add R$ ${addedValue.toFixed(2)}`);
      console.log(`[CALC] ${cleanTicker} TOTAL INVESTIDO: R$ ${asset.totalInvested.toFixed(2)} -> R$ ${newTotalInvested.toFixed(2)}`);

      const newQuantity = asset.quantity + quantity;
      asset.quantity = newQuantity;
      asset.totalInvested = newTotalInvested;
      asset.averagePrice = newQuantity > 0 ? newTotalInvested / newQuantity : 0;
    } else if (tx.type === 'Venda') {
      // O custo das ações vendidas deve ser baseado no preço médio de compra,
      // e não no preço de venda. Isso garante que o `totalInvested` reflita o custo
      // dos ativos que ainda estão na carteira.
      const costOfSoldShares = quantity * asset.averagePrice;
      console.log(`[CALC] ${cleanTicker} VENDA: Qtd ${quantity} (Preço Médio R$ ${asset.averagePrice.toFixed(2)}) = Removendo Custo R$ ${costOfSoldShares.toFixed(2)}`);

      asset.totalInvested = Math.max(0, asset.totalInvested - costOfSoldShares); // Garante que não fique negativo
      asset.quantity -= quantity;

      if (asset.quantity <= 0) {
        asset.averagePrice = 0;
        asset.totalInvested = 0;
      }
    }
  });

  // Retorna apenas os ativos que o usuário ainda possui (quantidade > 0)
  return Array.from(portfolioMap.values()).filter(asset => asset.quantity > 0);
}
