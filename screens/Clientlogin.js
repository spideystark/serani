import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Dimensions, TouchableOpacity, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { Border, Color, FontFamily, FontSize } from "../GlobalStyles";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";

const { width, height } = Dimensions.get('window');

const CLientlogin = () => {
  const navigation = useNavigation();
  const [profileImage, setProfileImage] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserId(user.uid);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setName(`${userData.firstName} ${userData.lastName}`);
          setEmail(userData.email);
          setProfileImage(userData.profileImage);
          setIsNewUser(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignUpPress = async () => {
    try {
      if (!name || !email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userData = {
        id: userCredential.user.uid,
        email,
        firstName,
        lastName,
        role: 'client',
        profileImage: profileImage || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", userCredential.user.uid), userData);
      navigation.navigate('ClientPage');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleLoginPress = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please enter email and password');
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('ClientPage');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      if (!userId) return;

      const [firstName, ...lastNameParts] = name.split(' ');
      const lastName = lastNameParts.join(' ');

      const updateData = {
        firstName,
        lastName,
        email,
        profileImage: profileImage || '',
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "users", userId), updateData);
      Alert.alert('Success', 'Profile updated successfully');
      navigation.navigate('ClientPage');  
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setProfileImage(result.assets[0].uri);
        if (userId) {
          await updateDoc(doc(db, "users", userId), {
            profileImage: result.assets[0].uri,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile image');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.client}>Client</Text>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.addPhotoText}>+</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.profileContainer}>
          <Text style={styles.myProfile}>My Profile</Text>
          <Text style={styles.updateYourAccount}>
            Update your account settings
          </Text>
          <View style={styles.formContainer}>
            <Text style={styles.personalInformation}>
              Personal information
            </Text>
            <Text style={styles.updateYourPersonal}>
              Update your personal information
            </Text>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Color.colorDarkgray}
              value={name}
              onChangeText={setName}
            />
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
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
            <View style={styles.buttonContainer}>
              {isNewUser ? (
                <>
                  <TouchableOpacity style={styles.button} onPress={handleSignUpPress}>
                    <Text style={styles.buttonText}>Sign up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.button} onPress={handleLoginPress}>
                    <Text style={styles.buttonText}>Login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[styles.button, { width: '100%' }]} onPress={handleUpdateProfile}>
                  <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
              )}
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  client: {
    fontSize: 40,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
  },
  profileContainer: {
    backgroundColor: Color.colorPaleturquoise,
    borderRadius: Border.br_11xl,
    padding: 20,
  },
  myProfile: {
    fontSize: FontSize.size_xl,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
    marginBottom: 10,
  },
  updateYourAccount: {
    fontSize: FontSize.size_sm,
    fontStyle: "italic",
    fontFamily: FontFamily.robotoBoldItalic,
    color: Color.colorDarkslategray,
    marginBottom: 20,
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 30,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Color.colorPaleturquoise,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: FontSize.size_xl,
    color: Color.colorDarkgray,
    fontFamily: FontFamily.robotoBold,
  },
  formContainer: {
    backgroundColor: Color.colorWhitesmoke_100,
    borderRadius: Border.br_11xl,
    padding: 20,
  },
  personalInformation: {
    fontSize: FontSize.size_mid,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
    marginBottom: 10,
  },
  updateYourPersonal: {
    fontSize: FontSize.size_smi,
    fontFamily: FontFamily.robotoLight,
    color: Color.colorBlack,
    marginBottom: 20,
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
  forgotPassword: {
    fontSize: FontSize.size_smi,
    color: Color.colorDarkslategray,
    fontFamily: FontFamily.robotoBoldItalic,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    backgroundColor: Color.colorDarkslategray,
    borderRadius: Border.br_11xl,
    padding: 15,
    width: '45%',
    alignItems: 'center',
  },
  buttonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.montserratSemiBold,
    fontSize: FontSize.size_mini,
    fontWeight: "600",
  },
});

export default CLientlogin;
