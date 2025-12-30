import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import colors from '../../styles/colors';
import { fetchMarketNews } from '../../services/newsService';

const NewsScreen = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const data = await fetchMarketNews();
      setNews(data);
    } catch (error) {
      console.error('Erro ao carregar notícias:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Don't know how to open URI: " + url);
      }
    } catch (err) {
      console.error("An error occurred", err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openLink(item.url)}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.textContainer}>
        <View style={styles.metaContainer}>
          <Text style={styles.source}>{item.source}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mercado Hoje</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(item) => item.title}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadNews}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    height: 120, // Altura fixa para consistência
  },
  image: {
    width: 120,
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  source: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
});

export default NewsScreen;
