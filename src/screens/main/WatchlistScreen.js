import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { colors } from '../../styles/colors';
import { formatCurrency } from '../../utils/formatters';
import { mockPortfolio } from '../../data/mockAssets';
import AssetCard from '../../components/common/AssetCard';

const WatchlistScreen = () => {
  const [watchlist, setWatchlist] = useState([
    // Lista inicial de favoritos (pode ser vazia ou com alguns ativos)
    mockPortfolio[0], // PETR4
    mockPortfolio[2], // ITUB4
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Filtrar watchlist
  const filteredWatchlist = useMemo(() => {
    let filtered = watchlist;

    // Filtro de busca
    if (searchQuery) {
      filtered = filtered.filter(
        asset =>
          asset.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          asset.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro de tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(asset => asset.type === filterType);
    }

    return filtered;
  }, [watchlist, searchQuery, filterType]);

  const removeFromWatchlist = (assetId) => {
    Alert.alert(
      'Remover dos Favoritos',
      'Tem certeza que deseja remover este ativo dos favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            setWatchlist(prev => prev.filter(asset => asset.id !== assetId));
          }
        }
      ]
    );
  };

  const addToWatchlist = (asset) => {
    if (!watchlist.find(item => item.id === asset.id)) {
      setWatchlist(prev => [...prev, asset]);
      Alert.alert('Sucesso', `${asset.ticker} adicionado aos favoritos!`);
    } else {
      Alert.alert('Aviso', `${asset.ticker} já está nos favoritos.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Meus Favoritos</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Em breve', 'Adicionar ativo aos favoritos')}
        >
          <Text style={styles.addButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.controlsContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar favoritos..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'Ação' && styles.filterChipActive]}
            onPress={() => setFilterType('Ação')}
          >
            <Text style={[styles.filterText, filterType === 'Ação' && styles.filterTextActive]}>
              Ações
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'FII' && styles.filterChipActive]}
            onPress={() => setFilterType('FII')}
          >
            <Text style={[styles.filterText, filterType === 'FII' && styles.filterTextActive]}>
              FIIs
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Watchlist List */}
        <View style={styles.listContainer}>
          {filteredWatchlist.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>⭐</Text>
              <Text style={styles.emptyTitle}>Nenhum favorito encontrado</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Tente outra busca' : 'Adicione seus primeiros favoritos'}
              </Text>
            </View>
          ) : (
            filteredWatchlist.map(asset => {
              const invested = asset.quantity * asset.avgPrice;
              const current = asset.quantity * asset.currentPrice;
              const profit = current - invested;

              return (
                <View key={asset.id} style={styles.assetContainer}>
                  <AssetCard
                    asset={asset}
                    onPress={() => {
                      Alert.alert(
                        asset.ticker,
                        `${asset.name}\n\n` +
                        `Quantidade: ${asset.quantity}\n` +
                        `Preço Médio: ${formatCurrency(asset.avgPrice)}\n` +
                        `Preço Atual: ${formatCurrency(asset.currentPrice)}\n\n` +
                        `Investido: ${formatCurrency(invested)}\n` +
                        `Valor Atual: ${formatCurrency(current)}\n` +
                        `Lucro: ${formatCurrency(profit)}`
                      );
                    }}
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromWatchlist(asset.id)}
                  >
                    <Text style={styles.removeButtonText}>Remover</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  filtersRow: {
    paddingLeft: 20,
    marginBottom: 12,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  assetContainer: {
    marginBottom: 16,
  },
  removeButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 64,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default WatchlistScreen;
