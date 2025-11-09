import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../styles/colors';
import { watchlistService } from '../../services/watchlistService';

/**
 * Componente reutilizável para exibir um card de ativo.
 * 
 * Responsabilidades:
 * - Exibir informações resumidas de um ativo (ticker, nome, preço, performance).
 * - Gerenciar o estado de "favorito" do ativo, consultando o `watchlistService`.
 * - Permitir que o usuário adicione ou remova o ativo da lista de favoritos.
 * - Navegar para a tela de detalhes do ativo (`AssetDetail`) ao ser pressionado.
 * 
 * @param {object} props
 * @param {object} props.asset - O objeto contendo os dados do ativo a ser exibido.
 * @param {function} [props.onPress] - Uma função opcional para substituir a ação de navegação padrão.
 */
const AssetCard = ({ asset, onPress }) => {
  // Hook do React Navigation para obter acesso ao objeto de navegação.
  const navigation = useNavigation();
  // Estado local para controlar se o ícone de estrela deve estar preenchido ou não.
  const [isFavorited, setIsFavorited] = useState(false);

  /**
   * `useEffect` é usado para verificar o status de favorito do ativo assim que o componente é montado
   * ou sempre que o `asset.ticker` mudar. Isso garante que o estado `isFavorited` esteja sempre sincronizado.
   */
  useEffect(() => {
    checkIfFavorited();
  }, [asset.ticker]);

  // Função assíncrona que consulta o serviço para saber se o ativo está na watchlist.
  const checkIfFavorited = async () => {
    const isFav = await watchlistService.isInWatchlist(asset.ticker);
    setIsFavorited(isFav);
  };

  /**
   * Lida com o clique no card.
   * Se uma função `onPress` foi passada via props, ela será executada.
   * Caso contrário, a ação padrão é navegar para a tela 'AssetDetail', passando o objeto `asset` como parâmetro.
   */
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate('AssetDetail', { asset });
    }
  };

  /**
   * Lida com o clique no botão de estrela.
   * Chama o serviço para adicionar/remover o ativo da watchlist e atualiza o estado local
   * para refletir a mudança visualmente de forma imediata.
   */
  const handleToggleFavorite = async () => {
    try {
      const added = await watchlistService.toggleWatchlist(asset.ticker);
      setIsFavorited(added);
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
    }
  };

  // Cálculos de performance do ativo.
  const profit = (asset.currentPrice - asset.avgPrice) * asset.quantity;
  const profitPercent = ((asset.currentPrice - asset.avgPrice) / asset.avgPrice) * 100;
  const isPositive = profit >= 0;

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {/* Star Button */}
      <TouchableOpacity // Botão de favoritar posicionado de forma absoluta no canto superior direito.
        style={styles.starButton}
        onPress={handleToggleFavorite}
      >
        <Text style={styles.starIcon}>
          {isFavorited ? '⭐' : '☆'}
        </Text>
      </TouchableOpacity>

      {/* Cabeçalho do Card: Ícone, Ticker e Nome */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>
            {asset.type === 'Ação' ? '📈' : '🏢'}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.ticker}>{asset.ticker}</Text>
          <Text style={styles.name} numberOfLines={1}>{asset.name}</Text>
        </View>
      </View>

      {/* Rodapé do Card: Preço Atual e Variação Percentual */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Preço Atual</Text>
          <Text style={styles.price}>R$ {asset.currentPrice.toFixed(2)}</Text>
        </View>
        <View style={[styles.changeBadge, {
          // A cor do badge de performance muda dinamicamente se o lucro for positivo ou negativo.
          backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20'
        }]}>
          <Text style={[styles.changeText, {
            color: isPositive ? colors.success : colors.danger
          }]}>
            {isPositive ? '▲' : '▼'} {Math.abs(profitPercent).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  starButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  starIcon: {
    fontSize: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginRight: 30,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  info: {
    flex: 1,
  },
  ticker: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  price: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AssetCard;
