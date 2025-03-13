import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const AuthScreen = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalSuccess, setModalSuccess] = useState(true); 

  useEffect(() => {
    const loadUsers = async () => {
      const storedUsers = await AsyncStorage.getItem('users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    };
    loadUsers();
  }, []);

  const validateFields = () => {
    if (isLogin) {
      if (!email || !password) {
        showError('Por favor, complete todos los campos');
        return false;
      }
    } else {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showError('Por favor, complete todos los campos');
        return false;
      }
      if (!validateEmail(email)) {
        showError('Por favor, ingrese un correo electrónico válido');
        return false;
      }
      if (!/^[a-zA-Z]+$/.test(firstName)) {
        showError('El nombre no debe contener números');
        return false;
      }
      if (!/^[a-zA-Z]+$/.test(lastName)) {
        showError('El apellido no debe contener números');
        return false;
      }
      if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return false;
      }
    }
    return true;
  };

  const showError = (message) => {
    setModalMessage(message);
    setModalSuccess(false);
    setModalVisible(true);
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleAuth = async () => {
    if (!validateFields()) {
      return;
    }

    if (isLogin) {
      const user = users.find(user => user.email === email && user.password === password);
      if (user) {
        setModalMessage('Inicio de sesión exitoso');
        setModalSuccess(true);
        setModalVisible(true);
        onLogin(email, password);
      } else {
        showError('Credenciales incorrectas');
      }
    } else {
      const existingUser = users.find(user => user.email === email);
      if (existingUser) {
        showError('El correo ya está registrado');
      } else {
        const newUser = { email, password, firstName, lastName };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
        // Almacenar nombre y apellido en AsyncStorage
        await AsyncStorage.setItem('customerName', `${firstName} ${lastName}`);
        setModalMessage('Registro exitoso');
        setModalSuccess(true);
        setModalVisible(true);
        setIsLogin(true);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cocktail Haven</Text>
      <Image 
        source={require('../img/logo.png')} 
        style={styles.logo} 
      />
      <Text style={styles.subtitle}>{isLogin ? 'Iniciar Sesión' : 'Registro'}</Text>

      <View style={styles.formContainer}>
        {!isLogin && (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#ff6f61" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#aaa"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#ff6f61" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#aaa"
              />
            </View>
          </>
        )}

        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="#ff6f61" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Correo Electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="#ff6f61" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor="#aaa"
          />
        </View>

        {!isLogin && (
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#ff6f61" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Confirmar Contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholderTextColor="#aaa"
            />
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</Text>
        </TouchableOpacity>

        <Text style={styles.switchText}>
          {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta? '}
          <Text style={styles.toggleText} onPress={() => setIsLogin(!isLogin)}>
            {isLogin ? ' Regístrate' : ' Accede'}
          </Text>
        </Text>
      </View>

      {/* Modal para mostrar mensajes de éxito y error */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Ionicons name={modalSuccess ? "checkmark-circle-outline" : "alert-circle-outline"} size={60} color={modalSuccess ? "#4caf50" : "#ff6f61"} />
            <Text style={styles.modalTitle}>{modalSuccess ? '¡Éxito!' : 'Error'}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#1f1f1f',
  },
  logo: {
    width: 150, // Ajusta el tamaño según sea necesario
    height: 150,
    alignSelf: 'center',
    marginVertical: 20, // Espacio vertical alrededor del logo
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#ff6f61',
  },
  subtitle: {
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    marginVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#3a3a3a',
    borderRadius: 5,
    padding: 10,
    elevation: 3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#fff',
  },
  button: {
    backgroundColor: '#ff6f61',
    borderRadius: 5,
    paddingVertical: 15,
    marginTop: 10,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  switchText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#757575',
  },
  toggleText: {
    color: '#ff6f61',
    fontWeight: 'bold',
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
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ff6f61',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 20,
    marginVertical: 10,
    color: '#333',
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#ff6f61',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default AuthScreen;