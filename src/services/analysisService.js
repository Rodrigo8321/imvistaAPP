export const analyzeAsset = (asset) => {
  const analysis = {
    recommendation: '',
    score: 0,
    strengths: [],
    weaknesses: [],
    alerts: [],
  };

  if (asset.type === 'Ação') {
    const f = asset.fundamentals;

    // P/L Analysis
    if (f.pl < 6) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'P/L Atrativo',
        value: f.pl.toFixed(2),
        reason: 'Ação pode estar subvalorizada',
      });
    } else if (f.pl > 15) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'P/L Elevado',
        value: f.pl.toFixed(2),
        reason: 'Possível sobrevalorização',
      });
    }

    // P/VP Analysis
    if (f.pvp < 1) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'P/VP < 1',
        value: f.pvp.toFixed(2),
        reason: 'Negociando abaixo do valor patrimonial',
      });
    } else if (f.pvp > 2) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'P/VP Alto',
        value: f.pvp.toFixed(2),
        reason: 'Prêmio elevado sobre patrimônio',
      });
    }

    // ROE Analysis
    if (f.roe > 20) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'ROE Excelente',
        value: f.roe.toFixed(1) + '%',
        reason: 'Alta rentabilidade sobre patrimônio',
      });
    } else if (f.roe < 10) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'ROE Baixo',
        value: f.roe.toFixed(1) + '%',
        reason: 'Rentabilidade abaixo da média',
      });
    }

    // Dividend Yield
    if (f.dy > 8) {
      analysis.score += 1;
      analysis.strengths.push({
        label: 'DY Atrativo',
        value: f.dy.toFixed(1) + '%',
        reason: 'Bom pagamento de dividendos',
      });
    }

    // Margem Líquida
    if (f.margLiq > 20) {
      analysis.score += 1;
      analysis.strengths.push({
        label: 'Margem Saudável',
        value: f.margLiq.toFixed(1) + '%',
        reason: 'Boa eficiência operacional',
      });
    } else if (f.margLiq < 10) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'Margem Baixa',
        value: f.margLiq.toFixed(1) + '%',
        reason: 'Eficiência operacional limitada',
      });
    }

  } else if (asset.type === 'FII') {
    const f = asset.fundamentals;

    // Dividend Yield
    if (f.dy > 10) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'DY Excepcional',
        value: f.dy.toFixed(1) + '%',
        reason: 'Rendimento muito atrativo',
      });
    } else if (f.dy < 6) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'DY Baixo',
        value: f.dy.toFixed(1) + '%',
        reason: 'Rendimento abaixo da média para FII',
      });
    }

    // P/VP
    if (f.pvp < 0.95) {
      analysis.score += 2;
      analysis.strengths.push({
        label: 'Desconto ao Patrimônio',
        value: f.pvp.toFixed(2),
        reason: 'Negociando com desconto',
      });
    } else if (f.pvp > 1.1) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'Prêmio ao Patrimônio',
        value: f.pvp.toFixed(2),
        reason: 'Negociando com prêmio',
      });
    }

    // Vacância
    if (f.vacancia < 5) {
      analysis.score += 1;
      analysis.strengths.push({
        label: 'Vacância Baixa',
        value: f.vacancia.toFixed(1) + '%',
        reason: 'Alta ocupação dos imóveis',
      });
    } else if (f.vacancia > 10) {
      analysis.score -= 1;
      analysis.weaknesses.push({
        label: 'Vacância Elevada',
        value: f.vacancia.toFixed(1) + '%',
        reason: 'Risco de redução de rendimentos',
      });
    }
  }

  // Performance Analysis
  const performance = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
  if (performance > 20) {
    analysis.alerts.push(`Valorização de ${performance.toFixed(1)}% - considere realizar lucros`);
  } else if (performance < -20) {
    analysis.alerts.push(`Desvalorização de ${performance.toFixed(1)}% - reavalie a tese`);
  }

  // Final Recommendation
  if (analysis.score >= 5) {
    analysis.recommendation = 'FORTE COMPRA';
  } else if (analysis.score >= 3) {
    analysis.recommendation = 'COMPRAR';
  } else if (analysis.score >= 1) {
    analysis.recommendation = 'MANTER';
  } else if (analysis.score >= -1) {
    analysis.recommendation = 'OBSERVAR';
  } else {
    analysis.recommendation = 'VENDER';
  }

  return analysis;
};

export const getRecommendationColor = (recommendation) => {
  const colorMap = {
    'FORTE COMPRA': '#10b981',
    'COMPRAR': '#34d399',
    'MANTER': '#3b82f6',
    'OBSERVAR': '#fbbf24',
    'VENDER': '#ef4444',
  };
  return colorMap[recommendation] || '#6b7280';
};
