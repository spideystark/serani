import * as React from "react";
import { useState } from "react";
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Color, Border, FontFamily, FontSize } from "../GlobalStyles";
import { auth } from "../utils/firebaseConfig";

const AdminLogin = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAdminLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password');
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // You might want to add additional admin-specific validation here
      navigation.navigate('AdminDashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.admin}>Admin</Text>
        </View>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>Admin Login</Text>
          <Text style={styles.loginSubtitle}>Enter your admin credentials</Text>
          
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor={Color.colorDarkgray}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={Color.colorDarkgray}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.loginButton} onPress={handleAdminLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  admin: {
    fontSize: 40,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
  },
  loginContainer: {
    backgroundColor: Color.colorPaleturquoise,
    borderRadius: Border.br_11xl,
    padding: 20,
  },
  loginTitle: {
    fontSize: FontSize.size_xl,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
    marginBottom: 10,
  },
  loginSubtitle: {
    fontSize: FontSize.size_sm,
    fontStyle: "italic",
    fontFamily: FontFamily.robotoBoldItalic,
    color: Color.colorDarkslategray,
    marginBottom: 20,
  },
  formContainer: {
    backgroundColor: Color.colorWhitesmoke_100,
    borderRadius: Border.br_11xl,
    padding: 20,
  },
  inputLabel: {
    fontSize: FontSize.size_mini,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoBold,
    marginBottom: 5,
  },
  input: {
    height: 45,
    borderColor: Color.colorPaleturquoise,
    borderWidth: 1,
    borderRadius: Border.br_11xl,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: FontSize.size_mini,
    fontFamily: FontFamily.robotoLight,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    fontSize: FontSize.size_smi,
    color: Color.colorDarkslategray,
    fontFamily: FontFamily.robotoBoldItalic,
  },
  loginButton: {
    backgroundColor: Color.colorDarkslategray,
    borderRadius: Border.br_11xl,
    padding: 15,
    alignItems: 'center',
  },
  loginButtonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.montserratSemiBold,
    fontSize: FontSize.size_mini,
    fontWeight: "600",
  },
});

export default AdminLogin;