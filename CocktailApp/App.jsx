import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import CartScreen from './src/screen/CartScreen';
import AuthScreen from './src/screen/AuthScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker'; 

const Stack = createStackNavigator();

const cocktailPrices = {
  "11007": 8.99,
  "15346": 7.99,
  "17105": 6.99,
};

function CocktailScreen({ navigation, onLogout }) {
  const [cocktails, setCocktails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCocktail, setSelectedCocktail] = useState(null);
  const [cart, setCart] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [category, setCategory] = useState('All');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories(); // Obtener categorías
  }, []);

  useEffect(() => {
    fetchCocktails(); // Obtener cócteles al cambiar la categoría
    loadCart();
  }, [category]);

  const fetchCocktails = async () => {
    try {
      setLoading(true);
      const url = category === 'All'
        ? "https://www.thecocktaildb.com/api/json/v1/1/filter.php?i=Vodka" // Cambia esto si deseas obtener todos los cócteles
        : `https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=${category}`;
      
      const response = await axios.get(url);
      setCocktails(response.data.drinks || []);
    } catch (error) {
      console.error('Error al obtener cócteles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    const storedCart = await AsyncStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get("https://www.thecocktaildb.com/api/json/v1/1/list.php?c=list");
      setCategories(response.data.drinks || []);
    } catch (error) {
      console.error('Error al obtener categorías:', error);
    }
  };

  const addToCart = async (cocktail) => {
    const updatedCart = [...cart, { ...cocktail, price: cocktailPrices[cocktail.idDrink] || 5.99 }];
    setCart(updatedCart);
    await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const fetchCocktailDetails = async (idDrink) => {
    try {
      const response = await axios.get(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${idDrink}`);
      const cocktailDetails = response.data.drinks[0];
      setSelectedCocktail(cocktailDetails);
    } catch (error) {
      console.error('Error al obtener detalles del cóctel:', error);
    }
  };

  const toggleMenu = () => setMenuVisible(!menuVisible);

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lista de Cócteles</Text>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={30} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.floatingButton} onPress={toggleMenu}>
        <Ionicons name="ellipsis-vertical" size={30} color="#fff" />
      </TouchableOpacity>

      {menuVisible && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Carrito')}>
            <Ionicons name="cart-outline" size={30} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Picker
        selectedValue={category}
        style={styles.picker}
        onValueChange={(itemValue) => setCategory(itemValue)}>
        <Picker.Item label="Todos" value="All" />
        {categories.map((cat) => (
          <Picker.Item key={cat.strCategory} label={cat.strCategory} value={cat.strCategory} />
        ))}
      </Picker>

      {loading ? (
        <ActivityIndicator size="large" color="#ff6f61" />
      ) : (
        <FlatList
          data={cocktails}
          keyExtractor={(item) => item.idDrink.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => fetchCocktailDetails(item.idDrink)} style={styles.card}>
              <Image source={{ uri: item.strDrinkThumb }} style={styles.imageThumbnail} />
              <Text style={styles.cardTitle}>{item.strDrink}</Text>
            </TouchableOpacity>
          )}
          numColumns={2}
          style={styles.flatList}
        />
      )}

      <Modal visible={!!selectedCocktail} animationType="slide" onRequestClose={() => setSelectedCocktail(null)}>
        <View style={styles.modalBackground}>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedCocktail?.strDrink}</Text>
            <Image source={{ uri: selectedCocktail?.strDrinkThumb }} style={styles.modalImage} />
            <Text style={styles.modalText}>Ingredientes:</Text>
            {[...Array(15)].map((_, i) => {
              const ingredient = selectedCocktail?.[`strIngredient${i + 1}`];
              return ingredient ? <Text key={i} style={styles.ingredient}>- {ingredient}</Text> : null;
            })}
            <Text style={styles.modalText}>Instrucciones:</Text>
            <Text style={styles.instructions}>{selectedCocktail?.strInstructionsES || selectedCocktail?.strInstructions}</Text>
            <Text style={styles.modalText}>Precio: ${cocktailPrices[selectedCocktail?.idDrink] || 5.99}</Text>
            <TouchableOpacity style={styles.button} onPress={() => {
              addToCart(selectedCocktail);
              setSelectedCocktail(null);
            }}>
              <Text style={styles.buttonText}>Agregar al carrito</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setSelectedCocktail(null)}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#4caf50" />
            <Text style={styles.modalTitle}>¡Cierre de Sesión!</Text>
            <Text style={styles.modalText}>Has cerrado sesión exitosamente.</Text>
            <TouchableOpacity style={styles.button} onPress={() => {
              setLogoutModalVisible(false);
              onLogout();
            }}>
              <Text style={styles.buttonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (email, password) => {
    if (email && password) {
      setUser({ email });
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Cócteles">
              {(props) => <CocktailScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="Carrito">
              {(props) => <CartScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
          </>
        ) : (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onLogin={handleLogin} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1f1f1f',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#ff6f61',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#2c2c2c',
    padding: 15,
    borderRadius: 25,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 5,
    color: '#fff',
  },
  imageThumbnail: {
    width: '100%',
    height: 160,
    borderRadius: 20,
    resizeMode: 'cover',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ff6f61',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 5,
    color: '#333',
  },
  ingredient: {
    fontSize: 18,
    marginLeft: 10,
    color: '#555',
  },
  instructions: {
    fontSize: 18,
    marginVertical: 5,
    color: '#333',
  },
  modalImage: {
    width: '100%',
    height: 300,
    borderRadius: 25,
    marginBottom: 15,
    resizeMode: 'cover',
  },
  button: {
    backgroundColor: '#ff6f61',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'transparent',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#ff6f61',
    borderRadius: 50,
    padding: 15,
    elevation: 5,
    zIndex: 100,
  },
  dropdownMenu: {
    position: 'absolute',
    bottom: 90,
    right: 30,
    backgroundColor: '#2c2c2c',
    borderRadius: 5,
    elevation: 5,
    padding: 10,
    zIndex: 99,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 100,
  },
  menuItem: {
    padding: 5,
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
  },
  flatList: {
    zIndex: 1,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff',
    backgroundColor: '#2c2c2c',
    borderRadius: 5,
    marginBottom: 20,
  },
});