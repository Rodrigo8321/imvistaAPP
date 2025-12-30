
/**
 * Serviço de Notícias para obter feed do mercado.
 * Usa Mocks por enquanto, mas pode ser facilmente conectado a uma API RSS.
 */

const NEWS_API_URL = 'https://newsapi.org/v2/everything?q=cripto&apiKey=...'; // Exemplo futuro

const MOCK_NEWS = [
  {
    title: "Ibovespa sobe 1,5% com otimismo sobre corte de juros",
    source: "InfoMoney",
    date: "10 min atrás",
    imageUrl: "https://images.unsplash.com/photo-1611974765215-fad3c20bc48c?q=80&w=200",
    url: "https://infomoney.com.br"
  },
  {
    title: "Bitcoin atinge nova máxima histórica de US$ 100k",
    source: "CoinTelegraph",
    date: "1 hora atrás",
    imageUrl: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=200",
    url: "https://cointelegraph.com.br"
  },
  {
    title: "Petrobras anuncia pagamento recorde de dividendos",
    source: "Valor Econômico",
    date: "2 horas atrás",
    imageUrl: "https://images.unsplash.com/photo-1565514020176-6c2235b8b337?q=80&w=200",
    url: "https://valor.globo.com"
  },
  {
    title: "Fed sinaliza manutenção das taxas de juros até final do ano",
    source: "Bloomberg",
    date: "3 horas atrás",
    imageUrl: "https://images.unsplash.com/photo-1526304640152-d4619684e884?q=80&w=200",
    url: "https://bloomberg.com"
  },
  {
    title: "Apple lança novo Vision Pro com foco no mercado corporativo",
    source: "TechCrunch",
    date: "5 horas atrás",
    imageUrl: "https://images.unsplash.com/photo-1592478411213-61535fdd28af?q=80&w=200",
    url: "https://techcrunch.com"
  }
];

export const fetchMarketNews = async () => {
  // Simula delay de rede
  await new Promise(resolve => setTimeout(resolve, 800));
  return MOCK_NEWS;
};