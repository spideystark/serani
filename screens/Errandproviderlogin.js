import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, Dimensions, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { Border, Color, FontFamily, FontSize } from "../GlobalStyles";

const { width, height } = Dimensions.get('window');

const RunnerProfiles = () => {
  const navigation = useNavigation();
  const auth = getAuth();
  const storage = getStorage();
  const db = getFirestore();
  
  const [profileImage, setProfileImage] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const uploadFile = async (uri, path) => {
    const MAX_RETRIES = 3;
    let attempt = 0;
  
    const upload = async () => {
      try {
        // Validate file exists
        if (!uri) throw new Error('No file selected');
  
        // Get file info
        const fileInfo = await getFileInfo(uri);
        if (!fileInfo) throw new Error('Invalid file');
  
        // Create blob with proper type
        const response = await fetch(uri);
        const blob = await response.blob();
  
        // Setup metadata
        const metadata = {
          contentType: fileInfo.mimeType || 'application/octet-stream',
          customMetadata: {
            originalName: fileInfo.name || 'unknown',
            uploadedAt: new Date().toISOString()
          }
        };
  
        // Create reference with unique name
        const fileName = `${Date.now()}-${fileInfo.name || 'file'}`;
        const storageRef = ref(storage, `${path}/${fileName}`);
  
        // Upload with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, blob, metadata);
  
        return new Promise((resolve, reject) => {
          uploadTask.on('state_changed',
            // Progress callback
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log('Upload progress: ' + progress + '%');
            },
            // Error callback
            (error) => {
              console.error('Upload failed:', error);
              reject(error);
            },
            // Success callback
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            }
          );
        });
  
      } catch (error) {
        console.error(`Upload attempt ${attempt + 1} failed:`, error);
        throw error;
      }
    };
  
    // Implement retry logic
    while (attempt < MAX_RETRIES) {
      try {
        return await upload();
      } catch (error) {
        attempt++;
        if (attempt === MAX_RETRIES) {
          console.error('Max retry attempts reached');
          return null;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  };
  
  // Helper function to get file info
  const getFileInfo = async (uri) => {
    try {
      if (uri.startsWith('file://')) {
        // Handle local files
        const filename = uri.split('/').pop();
        return {
          name: filename,
          mimeType: getMimeType(filename),
        };
      } else {
        // Handle remote files
        const response = await fetch(uri, { method: 'HEAD' });
        const contentType = response.headers.get('content-type');
        return {
          name: uri.split('/').pop(),
          mimeType: contentType,
        };
      }
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  };
  
  // Helper function to get mime type
  const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      let profileImageUrl = null;
      if (profileImage) {
        profileImageUrl = await uploadFile(profileImage, `runners/${user.uid}/profile.jpg`);
      }
  
      const uploadedDocs = await Promise.all(
        documents.map(async (doc, index) => {
          const url = await uploadFile(doc.uri, `runners/${user.uid}/documents/${doc.name}`);
          return url || null;
        })
      );
  
      // Filter out failed uploads
      const validDocs = uploadedDocs.filter(url => url !== null);
  
      // Create or update user document in Firestore with the role
      await setDoc(doc(db, 'runners', user.uid), {
        name, // Store the name
        email, // Store the email
        profileImage: profileImageUrl || null, // Store the profile image URL (null if not provided)
        documents: validDocs, // Store the valid document URLs
        createdAt: new Date().toISOString(),
        status: 'pending', // Set initial status as pending
        role: 'runner', // Add the role field (you can modify this value based on your app's logic)
      });
  
      navigation.navigate('RunnerPage');
    } catch (error) {
      console.error('Signup error:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('RunnerPage');
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: false,
    });

    if (result.type === 'success') {
      setDocuments([...documents, result]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.client}>Runner Profile</Text>
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
          <Text style={styles.updateYourAccount}>Create or login to your runner account</Text>
          
          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={Color.colorDarkgray}
            />
            
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholderTextColor={Color.colorDarkgray}
            />
            
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={Color.colorDarkgray}
            />

            <Text style={styles.inputLabel}>Required Documents</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Text style={styles.uploadButtonText}>Upload Document</Text>
            </TouchableOpacity>
            
            {documents.map((doc, index) => (
              <Text key={index} style={styles.documentName}>{doc.name}</Text>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleSignUp}
                disabled={loading}>
                <Text style={styles.buttonText}>Sign up</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
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
    fontSize: 30,
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
    borderRadius: 25,
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
  uploadButton: {
    backgroundColor: Color.colorPaleturquoise,
    borderRadius: Border.br_11xl,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadButtonText: {
    color: Color.colorDarkslategray,
    fontFamily: FontFamily.montserratSemiBold,
    fontSize: FontSize.size_mini,
    fontWeight: "600",
  },
  documentName: {
    fontSize: FontSize.size_smi,
    fontFamily: FontFamily.robotoLight,
    color: Color.colorBlack,
    marginBottom: 5,
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

export default RunnerProfiles;