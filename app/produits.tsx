import { FILE_URL } from "@/config";
import debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProductCard } from "../components/ui/ProductCard";
import api from "./api/api";

interface Product {
  id: string;
  name: string;
  price: number;
  discountedPrice?: number;
  image?: string;
  description?: string;
  brand?: string;
  sizes?: string[];
  availableSizes?: string[];
  variants?: Variant[];
  category?: {
    id: number;
    name: string;
  };
  inStock: boolean;
  stock: number;
  discounts?: Discount[];
}

interface Variant {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string;
}

interface Property {
  id: string;
  name: string;
  value: string;
}

interface FilterState {
  categoryId: string | null;
  minPrice: string;
  maxPrice: string;
  search: string;
  stockStatus: string | null;
}

interface Discount {
  id: number;
  type: 'percentage' | 'fixed';
  value: number;
  startDate?: string;
  endDate?: string;
}

const { width } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_MARGIN = 10;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("name");
  const [filters, setFilters] = useState<FilterState>({
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    search: '',
    stockStatus: null
  });
  const [priceModalVisible, setPriceModalVisible] = useState(false);
  const [tempMinPrice, setTempMinPrice] = useState('');
  const [tempMaxPrice, setTempMaxPrice] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((text: string) => {
      setFilters(prev => ({ ...prev, search: text }));
      fetchProducts(true);
    }, 500),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setIsSearching(true);
    debouncedSearch(text);
  };

  // Fonction de tri séparée
  const sortProducts = useCallback((productsToSort: Product[]) => {
    return [...productsToSort].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return (a.discountedPrice || a.price) - (b.discountedPrice || b.price);
        case "price-desc":
          return (b.discountedPrice || b.price) - (a.discountedPrice || a.price);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  }, [sortBy]);

  // Appliquer le tri quand sortBy change
  useEffect(() => {
    if (products.length > 0) {
      const sortedProducts = sortProducts(products);
      setProducts(sortedProducts);
    }
  }, [sortBy, sortProducts]);

  const fetchProducts = async (shouldRefresh: boolean = false) => {
    try {
      setLoading(true);
      setSearchError(null);
      let allProducts: Product[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const params = new URLSearchParams({
          include: 'discounts,stock',
          limit: '15',
          page: currentPage.toString(),
          ...(filters.categoryId && { category_id: filters.categoryId }),
          ...(filters.minPrice && { min_price: filters.minPrice }),
          ...(filters.maxPrice && { max_price: filters.maxPrice }),
          ...(filters.search && { search: filters.search }),
          ...(filters.stockStatus && { stock_status: filters.stockStatus })
        });

        const response = await api.get(`/products?${params}`);

        const pageData = response.data?.data;
        if (!pageData) {
          throw new Error("Format de réponse invalide");
        }

        const productsData = pageData.data || [];
        allProducts = [...allProducts, ...productsData];

        const meta = pageData.meta;
        hasMorePages = currentPage < meta.lastPage;
        currentPage++;
      }

      // Traitement des réductions et du stock
      const processedProducts = allProducts.map((product: Product) => {
        const hasValidDiscount = product.discounts &&
          product.discounts.length > 0 &&
          isDiscountValid(product.discounts[0]);

        return {
          ...product,
          inStock: product.stock > 0,
          discountedPrice: hasValidDiscount
            ? calculateDiscountedPrice(product.price, product.discounts![0])
            : undefined
        };
      });

      // Appliquer le tri aux produits traités
      const sortedProducts = sortProducts(processedProducts);
      setProducts(sortedProducts);

      if (sortedProducts.length === 0) {
        setSearchError("Aucun produit trouvé pour votre recherche");
      }

    } catch (error: any) {
      console.error("Erreur lors de la récupération des produits:", error);
      setSearchError("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsSearching(false);
    }
  };

  const isDiscountValid = (discount: Discount): boolean => {
    if (!discount) return false;

    const now = new Date();
    const startDate = discount.startDate ? new Date(discount.startDate) : null;
    const endDate = discount.endDate ? new Date(discount.endDate) : null;

    // Vérifier si la réduction est dans sa période de validité
    if (startDate && startDate > now) return false;
    if (endDate && endDate < now) return false;

    return true;
  };

  const calculateDiscountedPrice = (originalPrice: number, discount: Discount): number | undefined => {
    if (!discount) return undefined;

    if (discount.type === 'percentage') {
      return originalPrice * (1 - discount.value / 100);
    } else if (discount.type === 'fixed') {
      return Math.max(0, originalPrice - discount.value);
    }

    return undefined;
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    fetchProducts(true);
  };

  useEffect(() => {
    fetchProducts(true);
  }, [selectedCategory, searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(true);
  };

  const categories = Array.from(new Set(products.map(p => p.brand || "").filter(Boolean)));

  const renderCategoryFilter = () => {
    const uniqueCategories = Array.from(
      new Set(products.map(p => p.category?.name).filter((name): name is string => name !== undefined))
    ).sort();

    return (
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              !selectedCategory && styles.filterChipActive,
            ]}
            onPress={() => {
              setSelectedCategory(null);
              handleFilterChange({ categoryId: null });
            }}
          >
            <Text style={[
              styles.filterChipText,
              !selectedCategory && styles.filterChipTextActive
            ]}>Tous</Text>
          </TouchableOpacity>
          {uniqueCategories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipActive,
              ]}
              onPress={() => {
                setSelectedCategory(category);
                const categoryId = products.find(p => p.category?.name === category)?.category?.id;
                if (categoryId) {
                  handleFilterChange({ categoryId: categoryId.toString() });
                }
              }}
            >
              <Text style={[
                styles.filterChipText,
                selectedCategory === category && styles.filterChipTextActive
              ]}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAdvancedFilters = () => (
    <View style={styles.filterSection}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* Filtre par prix */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            (filters.minPrice || filters.maxPrice) && styles.filterChipActive
          ]}
          onPress={() => setPriceModalVisible(true)}
        >
          <Text style={styles.filterChipText}>
            {filters.minPrice || filters.maxPrice ?
              `${filters.minPrice || '0'} GNF - ${filters.maxPrice || '∞'} GNF` :
              'Prix'}
          </Text>
        </TouchableOpacity>

        {/* Filtre par stock */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.stockStatus && styles.filterChipActive
          ]}
          onPress={() => {
            Alert.alert(
              'Disponibilité',
              'Sélectionnez le statut',
              [
                {
                  text: 'En stock',
                  onPress: () => handleFilterChange({ stockStatus: 'in_stock' })
                },
                {
                  text: 'Rupture de stock',
                  onPress: () => handleFilterChange({ stockStatus: 'out_of_stock' })
                },
                {
                  text: 'Tous',
                  onPress: () => handleFilterChange({ stockStatus: null })
                }
              ]
            );
          }}
        >
          <Text style={styles.filterChipText}>
            {filters.stockStatus === 'in_stock' ? 'En stock' :
              filters.stockStatus === 'out_of_stock' ? 'Rupture de stock' :
                'Disponibilité'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal pour la saisie des prix */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={priceModalVisible}
        onRequestClose={() => setPriceModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrer par prix</Text>

            <TextInput
              style={styles.input}
              placeholder="Prix minimum"
              keyboardType="numeric"
              value={tempMinPrice}
              onChangeText={setTempMinPrice}
            />

            <TextInput
              style={styles.input}
              placeholder="Prix maximum"
              keyboardType="numeric"
              value={tempMaxPrice}
              onChangeText={setTempMaxPrice}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPriceModalVisible(false);
                  setTempMinPrice('');
                  setTempMaxPrice('');
                }}
              >
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={() => {
                  handleFilterChange({
                    minPrice: tempMinPrice,
                    maxPrice: tempMaxPrice
                  });
                  setPriceModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Appliquer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderSortOptions = () => (
    <View style={styles.sortContainer}>
      <Text style={styles.sortLabel}>Trier par:</Text>
      <TouchableOpacity
        style={[styles.sortButton, sortBy === "name" && styles.selectedSort]}
        onPress={() => setSortBy("name")}
      >
        <Text style={sortBy === "name" ? styles.selectedSortText : styles.sortButtonText}>Nom</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sortButton, sortBy === "price-asc" && styles.selectedSort]}
        onPress={() => setSortBy("price-asc")}
      >
        <Text style={sortBy === "price-asc" ? styles.selectedSortText : styles.sortButtonText}>Prix croissant</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.sortButton, sortBy === "price-desc" && styles.selectedSort]}
        onPress={() => setSortBy("price-desc")}
      >
        <Text style={sortBy === "price-desc" ? styles.selectedSortText : styles.sortButtonText}>Prix décroissant</Text>
      </TouchableOpacity>
    </View>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      id={parseInt(item.id)}
      name={item.name}
      description={item.description || ""}
      image={item.image ? `${FILE_URL}/${item.image}` : ""}
      price={item.price}
      discountedPrice={item.discountedPrice}
      inStock={item.inStock}
    />
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => {
              setFilters(prev => ({ ...prev, search: searchQuery }));
              fetchProducts(true);
            }}
          />
          {isSearching && (
            <ActivityIndicator 
              size="small" 
              color="#F59E0B" 
              style={styles.searchIndicator}
            />
          )}
        </View>
        {searchError && (
          <Text style={styles.errorText}>{searchError}</Text>
        )}
      </View>

      {renderCategoryFilter()}
      {renderAdvancedFilters()}
      {renderSortOptions()}

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#F59E0B" />
            ) : (
              <Text style={styles.emptyText}>
                {searchError || "Aucun produit disponible"}
              </Text>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContainer: {
    paddingHorizontal: CARD_MARGIN / 2,
    paddingVertical: CARD_MARGIN,
  },
  row: {
    justifyContent: "space-between",
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
  },
  productImage: {
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: "#f5f5f5",
  },
  productInfo: {
    padding: 12,
    position: "relative",
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15,
    padding: 5,
  },
  addButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "#F59E0B",
    borderRadius: 15,
    padding: 5,
  },
  searchContainer: {
    padding: 10,
    backgroundColor: "#fff",
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
  },
  searchIndicator: {
    position: 'absolute',
    right: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  filterSection: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: "#fff",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
    minWidth: 80,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#F59E0B',
  },
  filterChipText: {
    fontSize: 14,
    color: '#000',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    backgroundColor: "#fff",
  },
  sortLabel: {
    marginRight: 10,
    fontWeight: "bold",
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
  },
  selectedSort: {
    backgroundColor: '#F59E0B',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#000',
  },
  selectedSortText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  applyButton: {
    backgroundColor: '#F59E0B',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
  },
  paginationButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  paginationButtonText: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paginationText: {
    fontWeight: 'bold',
  },
  categoryScrollContent: {
    paddingHorizontal: 10,
  },
});