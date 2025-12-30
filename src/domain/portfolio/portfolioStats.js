// src/domain/portfolio/portfolioStats.js

export function getPortfolioStats({ portfolio, prices, exchangeRate = 5.0 }) {
  let totalCurrent = 0;
  let totalInvested = 0;
  let totalMonthlyDividends = 0;
  let investedUSD = 0;
  let dailyProfitBRL = 0;

  const uniqueTickers = new Set();

  if (!portfolio || !Array.isArray(portfolio)) {
    return {
      totalCurrent: 0,
      totalInvested: 0,
      profit: 0,
      profitabilityPercent: 0,
      diversificationCount: 0,
      totalMonthlyDividends: 0,
      investedUSD: 0,
      dailyProfitBRL: 0,
    };
  }

  portfolio.forEach(asset => {
    const priceData = prices?.[asset.ticker];
    const currentPriceRaw = priceData?.price ?? asset.currentPrice ?? 0;
    const previousClose = priceData?.previousClose ?? currentPriceRaw;

    const currentPriceBRL = asset.currency === 'USD' ? currentPriceRaw * exchangeRate : currentPriceRaw;

    totalCurrent += asset.quantity * currentPriceBRL;
    totalInvested += asset.totalInvested || 0;
    totalMonthlyDividends += asset.monthlyDividends || 0;

    // Calculate USD investment for assets with USD currency
    if (asset.currency === 'USD') {
      investedUSD += asset.totalInvested || 0;
    }

    // Calculate daily profit/loss in BRL
    const dailyChange = currentPriceRaw - previousClose;
    const dailyProfit = asset.quantity * dailyChange;
    dailyProfitBRL += asset.currency === 'USD' ? dailyProfit * exchangeRate : dailyProfit;

    uniqueTickers.add(asset.ticker);
  });

  const profit = totalCurrent - totalInvested;

  const profitabilityPercent =
    totalInvested > 0
      ? (profit / totalInvested) * 100
      : 0;

  return {
    totalCurrent,
    totalInvested,
    profit,
    profitabilityPercent,
    diversificationCount: uniqueTickers.size,
    totalMonthlyDividends,
    investedUSD,
    dailyProfitBRL,
  };
}
