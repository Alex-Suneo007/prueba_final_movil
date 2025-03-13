import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from 'react-native-modal-datetime-picker';

export default function CartScreen({ navigation, onLogout }) {
  const [cart, setCart] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [total, setTotal] = useState(0);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');

  // Estados para el formulario de pago
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    const storedCart = await AsyncStorage.getItem('cart');
    if (storedCart) setCart(JSON.parse(storedCart));
  };

  const updateQuantity = async (index, change) => {
    const updatedCart = [...cart];
    if (change < 0 && (updatedCart[index].quantity || 1) <= 1) {
      removeCocktail(index);
    } else {
      updatedCart[index].quantity = (updatedCart[index].quantity || 1) + change;
      setCart(updatedCart);
      await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
    }
  };

  const removeCocktail = async (index) => {
    Alert.alert(
      'Eliminar cóctel',
      '¿Estás seguro de que deseas eliminar este cóctel del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', onPress: () => {
            const updatedCart = [...cart];
            updatedCart.splice(index, 1);
            setCart(updatedCart);
            AsyncStorage.setItem('cart', JSON.stringify(updatedCart));
          }
        }
      ]
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const iva = subtotal * 0.12; // 12% IVA
    return subtotal + iva;
  };

  const handlePayment = () => {
    const calculatedTotal = calculateTotal();
    setTotal(calculatedTotal);
    setPaymentModalVisible(true);
  };

  const validatePayment = () => {
    if (paymentMethod === 'Tarjeta de Crédito') {
      if (!/^\d{16}$/.test(cardNumber)) {
        Alert.alert('Error', 'Por favor, ingresa un número de tarjeta válido (16 dígitos).');
        return false;
      }
      if (!expirationDate) {
        Alert.alert('Error', 'Por favor, selecciona la fecha de vencimiento.');
        return false;
      }
      if (!/^\d{3}$/.test(cvv)) {
        Alert.alert('Error', 'Por favor, ingresa un CVV válido (3 dígitos).');
        return false;
      }
    } else if (paymentMethod === 'PayPal') {
      const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
      if (!emailRegex.test(paypalEmail)) {
        Alert.alert('Error', 'Por favor, ingresa un correo de PayPal válido.');
        return false;
      }
    } else if (paymentMethod === 'Transferencia Bancaria') {
      if (!/^\d{10,}$/.test(bankAccount)) {
        Alert.alert('Error', 'Por favor, ingresa un número de cuenta bancaria válido.');
        return false;
      }
    }
    return true;
  };

  const handleSubmitPayment = async () => {
    if (!validatePayment()) return;

    // Vaciar el carrito después de realizar la compra
    await AsyncStorage.removeItem('cart');
    setCart([]);
    
    setModalVisible(true); // Mostrar modal de pago realizado
    setPaymentModalVisible(false);
    setCardNumber('');
    setExpirationDate('');
    setCvv('');
    setPaypalEmail('');
    setBankAccount('');
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
    onLogout();
  };

  const handleDatePicked = (date) => {
    const formattedDate = `${date.getMonth() + 1}/${date.getFullYear()}`; // Formato MM/AA
    setExpirationDate(formattedDate);
    setDatePickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Cócteles')}>
          <Ionicons name="arrow-back-outline" size={30} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Carrito de Compras</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
      {cart.length === 0 ? (
        <Text style={styles.emptyText}>El carrito está vacío.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.cartItem}>
              <Image source={{ uri: item.strDrinkThumb }} style={styles.cartImage} />
              <View style={styles.itemDetails}>
                <Text style={styles.cartText}>{item.strDrink}</Text>
                <Text style={styles.priceText}>${item.price.toFixed(2)} x {(item.quantity || 1)}</Text>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity onPress={() => updateQuantity(index, -1)} style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(index, 1)} style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.removeButton} onPress={() => removeCocktail(index)}>
                <Ionicons name="trash-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <View style={styles.totalContainer}>
        <Text style={styles.totalText}>Subtotal: ${cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2)}</Text>
        <Text style={styles.totalText}>IVA (12%): ${(cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) * 0.12).toFixed(2)}</Text>
        <Text style={styles.totalText}>Total: ${calculateTotal().toFixed(2)}</Text>
        {cart.length > 0 && (
          <TouchableOpacity style={styles.paymentButton} onPress={handlePayment}>
            <Text style={styles.paymentButtonText}>Pagar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modal para el formulario de pago */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Ionicons name="card-outline" size={60} color="#4caf50" />
            <Text style={styles.modalTitle}>Método de Pago</Text>
            <Text style={styles.selectPaymentText}>{paymentMethod || 'Seleccione su método de pago'}</Text>
            <Picker
              selectedValue={paymentMethod}
              style={styles.picker}
              onValueChange={(itemValue) => {
                setPaymentMethod(itemValue);
                setCardNumber('');
                setExpirationDate('');
                setCvv('');
                setPaypalEmail('');
                setBankAccount('');
              }}>
              <Picker.Item label="Tarjeta de Crédito" value="Tarjeta de Crédito" />
              <Picker.Item label="PayPal" value="PayPal" />
              <Picker.Item label="Transferencia Bancaria" value="Transferencia Bancaria" />
            </Picker>

            {paymentMethod === 'Tarjeta de Crédito' && (
              <>
                <TextInput
                  placeholder="Número de tarjeta (16 dígitos)"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={16} // Limitar a 16 dígitos
                />
                <View style={styles.datePickerContainer}>
                  <TouchableOpacity onPress={() => setDatePickerVisible(true)} style={styles.datePickerButton}>
                    <Ionicons name="calendar-outline" size={24} color="#fff" />
                    <Text style={styles.datePickerText}>
                      {expirationDate ? `Fecha de vencimiento: ${expirationDate}` : 'Seleccionar fecha de vencimiento'}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePicker
                    isVisible={isDatePickerVisible}
                    mode="date"
                    onConfirm={handleDatePicked}
                    onCancel={() => setDatePickerVisible(false)}
                    minimumDate={new Date()}
                  />
                </View>
                <TextInput
                  placeholder="CVV (3 dígitos)"
                  value={cvv}
                  onChangeText={setCvv}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={3} // Limitar a 3 dígitos
                />
              </>
            )}

            {paymentMethod === 'PayPal' && (
              <TextInput
                placeholder="Correo de PayPal"
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                style={styles.input}
              />
            )}

            {paymentMethod === 'Transferencia Bancaria' && (
              <TextInput
                placeholder="Número de cuenta bancaria (mínimo 10 dígitos)"
                value={bankAccount}
                onChangeText={setBankAccount}
                style={styles.input}
                keyboardType="numeric"
                maxLength={20} // Puedes ajustar según el formato de la cuenta bancaria
              />
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitPayment}>
              <Text style={styles.submitButtonText}>Enviar Pago</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={() => setPaymentModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para mostrar el mensaje de pago realizado */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#4caf50" />
            <Text style={styles.modalTitle}>¡Pago Realizado!</Text>
            <Text style={styles.modalMessage}>Método de pago: {paymentMethod}</Text>
            <Text style={styles.modalMessage}>Total a pagar: ${total.toFixed(2)}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para mostrar el mensaje de cierre de sesión */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={logoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Ionicons name="checkmark-circle-outline" size={60} color="#4caf50" />
            <Text style={styles.modalTitle}>¡Cierre de Sesión!</Text>
            <Text style={styles.modalMessage}>Has cerrado sesión exitosamente.</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setLogoutModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f1f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f1f1f',
    paddingVertical: 30,
    paddingHorizontal: 15,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6f61',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#fff',
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    elevation: 3,
  },
  cartImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  cartText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceText: {
    fontSize: 14,
    color: '#ff6f61',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  quantityButton: {
    backgroundColor: '#ff6f61',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginHorizontal: 5,
  },
  quantityButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#ff6f61',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  totalContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    elevation: 3,
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  paymentButton: {
    backgroundColor: '#ff6f61',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  paymentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#4caf50',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: 'transparent',
  },
  closeButtonText: {
    color: '#ff6f61',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#ff6f61',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  selectPaymentText: {
    fontSize: 16,
    color: '#4caf50',
    marginVertical: 10,
    textAlign: 'center',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#fff',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#ff6f61',
    borderRadius: 5,
    padding: 10,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  datePickerText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});