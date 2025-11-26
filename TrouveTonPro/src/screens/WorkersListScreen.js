// src/screens/WorkersListScreen.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {useFocusEffect} from '@react-navigation/native';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  I18nManager,
  ActivityIndicator,
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Feather } from '@expo/vector-icons'; 

// --- CONFIGURATION API ---
const IP = 'http://172.16.172.70:8000'; 
const API_URL = `${IP}/api/workers/`; 
// -------------------------

// --- Mapped Component (WorkerItem) ---
const WorkerItem = ({ worker, navigation }) => {
  // L'ImageField de Django devrait garantir une URL, mais cette variable est plus propre.
  const imageUrl = worker.image;

  return (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => 
        navigation.navigate('WorkerDetail', { workerId: worker.id, workerName: `${worker.first_name} ${worker.last_name}` })
      }
    >
      <View style={styles.headerContainer}>
        {/* AFFICHAGE DE L'IMAGE */}
        <Image 
          // Utilisez l'URL directement. Si l'URL est invalide, React Native 
          // affichera une image cassée ou un avertissement. Assurez-vous que l'URL est bonne côté Django.
          source={{ uri: imageUrl }} 
          style={styles.workerImage} 
        /> 
        
        <View style={{ flex: 1 }}> 
          <Text style={styles.category}>{worker.category}</Text>
          <Text style={styles.name}>{worker.first_name} {worker.last_name}</Text>
        </View>
      </View>
      
      <Text style={styles.detail}>المدينة: {worker.city}</Text>
      <Text style={styles.tapToView}>اضغط لرؤية التفاصيل والتواصل </Text>
    </TouchableOpacity>
  );
};

// --- Main Screen Component ---
const WorkersListScreen = ({ navigation }) => {
  const [workers, setWorkers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('كل الفئات'); 
  const [sortCriteria, setSortCriteria] = useState('name'); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

// --- LOGIQUE DE RÉCUPÉRATION DES DONNÉES DE L'API (MISE À JOUR) ---
    const fetchWorkers = async () => {
        setIsLoading(true); // Remettre à true à chaque rappel
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            setWorkers(data); 
            setError(null);
        } catch (err) {
            console.error("Erreur de l'API Django:", err);
            setError(`Impossible de charger les données. Vérifiez le serveur Django (IP et port 8000).`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // NOUVEAU HOOK : useFocusEffect
    // Il exécute le callback (fetchWorkers) chaque fois que l'écran devient actif.
    useFocusEffect(
        // Le useCallback est nécessaire pour garantir que l'effet ne se ré-exécute 
        // qu'en cas de nécessité, améliorant la performance.
        useCallback(() => {
            fetchWorkers();
            
            // Si vous retournez une fonction ici, elle sera exécutée lors de la 
            // sortie de l'écran (un 'cleanup' ou nettoyage), ce qui est optionnel ici.
            return () => {
                // Optionnel : Annuler des requêtes en cours si besoin
            };
        }, []) // Le tableau de dépendances vide garantit qu'il s'exécute à chaque focus
    );

  // LOGIQUE DE FILTRAGE ET TRI
  const allCategories = useMemo(() => {
    if (!workers.length) return ['كل الفئات'];
    return ['كل الفئات', ...new Set(workers.map(w => w.category))];
  }, [workers]);

  const sortedAndFilteredWorkers = useMemo(() => {
    let list = workers.filter(worker => {
      // 1. Filtre de recherche
      const lowerCaseSearch = searchTerm.toLowerCase();
      const workerInfo = 
        `${worker.first_name} ${worker.last_name} ${worker.category} ${worker.city}`.toLowerCase();
      const matchesSearch = workerInfo.includes(lowerCaseSearch);

      // 2. Filtre de catégorie
      const matchesCategory = 
        selectedCategory === 'كل الفئات' || worker.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // 3. Tri
    list.sort((a, b) => {
      let valA, valB;
      if (sortCriteria === 'name') {
        valA = a.last_name; 
        valB = b.last_name;
      } else if (sortCriteria === 'city') {
        valA = a.city;
        valB = b.city;
      } else {
        return 0;
      }
      return valA.localeCompare(valB, 'ar'); 
    });

    return list;
  }, [workers, searchTerm, selectedCategory, sortCriteria]);

  // Gestion du changement de catégorie
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchTerm(''); 
  };

  // RENDU CONDITIONNEL (Chargement)
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري التحميل... ⏳</Text>
      </View>
    );
  }

  // RENDU CONDITIONNEL (Erreur)
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>❌ {error}</Text>
        <Text style={styles.subErrorText}>Veuillez vérifier votre adresse IP et le serveur Django.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}> 
      <Text style={styles.header}>دليل المهنيين 🛠️</Text>

      {/* Champ de Recherche */}
      <TextInput
        style={[styles.searchInput, { textAlign: I18nManager.isRTL ? 'right' : 'left' }]}
        placeholder="ابحث بالاسم، المدينة، المهنة..."
        value={searchTerm}
        onChangeText={setSearchTerm} 
      />

      {/* 1. Boutons de Filtre par Catégorie */}
      <View style={styles.filterBarContainer}>
        <Text style={styles.filterLabel}>تصفية:</Text>
        <FlatList
          data={allCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategoryChange(item)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategory === item && styles.categoryButtonTextActive,
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
      
      {/* 2. Boutons de Tri */}
      <View style={styles.filterBarContainer}>
        <Text style={styles.filterLabel}>فرز حسب:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortCriteria === 'name' && styles.sortButtonActive]}
          onPress={() => setSortCriteria('name')}
        >
          <Text style={[styles.sortButtonText, sortCriteria === 'name' && styles.sortButtonTextActive]}>الاسم</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortCriteria === 'city' && styles.sortButtonActive]}
          onPress={() => setSortCriteria('city')}
        >
          <Text style={[styles.sortButtonText, sortCriteria === 'city' && styles.sortButtonTextActive]}>المدينة</Text>
        </TouchableOpacity>
      </View>


      {/* Liste des Professionnels */}
      <FlatList
        data={sortedAndFilteredWorkers} 
        renderItem={({ item }) => <WorkerItem worker={item} navigation={navigation} />} 
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <Text style={styles.emptyMessage}>
            لم يتم العثور على أي مهنيين يتطابقون مع المعايير.
          </Text>
        )}
      />
    </SafeAreaView>
  );
};

// --- Styles pour WorkersListScreen ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' },
  loadingText: { fontSize: 20, color: '#007AFF', fontWeight: 'bold', marginTop: 10 },
  errorText: { fontSize: 18, color: 'red', fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 20 },
  subErrorText: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 5, marginBottom: 10, color: '#333' },
  searchInput: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginHorizontal: 16, marginBottom: 15, backgroundColor: '#fff', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  itemContainer: { backgroundColor: '#fff', padding: 15, marginVertical: 8, marginHorizontal: 16, borderRadius: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 5 },
  workerImage: { 
    width: 50,
    height: 50,
    borderRadius: 25, 
    marginRight: I18nManager.isRTL ? 0 : 10,
    marginLeft: I18nManager.isRTL ? 10 : 0,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  category: { fontSize: 18, fontWeight: 'bold', color: '#007AFF', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 0, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  detail: { fontSize: 14, color: '#666', marginTop: 5, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  tapToView: { fontSize: 12, color: '#007AFF', marginTop: 10, fontStyle: 'italic', textAlign: I18nManager.isRTL ? 'left' : 'right' },
  emptyMessage: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
  filterBarContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 10 },
  filterLabel: { fontSize: 14, fontWeight: 'bold', color: '#666', marginRight: I18nManager.isRTL ? 0 : 10, marginLeft: I18nManager.isRTL ? 10 : 0, flexShrink: 0, textAlign: 'right' },
  categoryButton: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: I18nManager.isRTL ? 0 : 8, marginLeft: I18nManager.isRTL ? 8 : 0, borderWidth: 1, borderColor: '#ccc' },
  categoryButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryButtonText: { fontSize: 14, color: '#333', textAlign: 'center' },
  categoryButtonTextActive: { color: 'white' },
  sortButton: { backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, marginRight: I18nManager.isRTL ? 0 : 8, marginLeft: I18nManager.isRTL ? 8 : 0, borderWidth: 1, borderColor: '#ddd' },
  sortButtonActive: { backgroundColor: '#6C757D', borderColor: '#6C757D' },
  sortButtonText: { fontSize: 14, color: '#333', textAlign: 'center' },
  sortButtonTextActive: { color: 'white', fontWeight: 'bold' }
});

export default WorkersListScreen;