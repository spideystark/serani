import * as React from "react";
import { useState, useEffect } from "react";
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import { Border, Color, FontFamily, FontSize } from "../GlobalStyles";

const ErrandProviderSignup = () => {
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
  const [selectedServices, setSelectedServices] = useState([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  
  // Available services
  const availableServices = [
    // Household Chores
    "House Cleaning", "Laundry & Ironing", "Dish Washing", "Window Cleaning",
    "Carpet Cleaning", "Bathroom Deep Clean", "Kitchen Deep Clean",
    "Organizing & Decluttering", "Bed Making & Changing", "Floor Mopping & Sweeping",

    // Delivery and Drop-offs
    "Food Delivery", "Package Pickup & Delivery", "Grocery Delivery",
    "Document Delivery", "Medicine Delivery", "Gift Delivery",
    "Laundry Pickup & Drop", "Courier Services", "Furniture Delivery", "Same Day Delivery",

    // Business Services
    "Data Entry", "Document Scanning", "Filing & Organization", "Basic Bookkeeping",
    "Presentation Creation", "Research Services", "Meeting Minutes Taking",
    "Email Management", "Business Document Writing",

    // Grocery & Shopping
    "Grocery Shopping", "Personal Shopping", "Home Supplies Shopping",
    "Electronics Shopping", "Gift Shopping", "Medicine Shopping",
    "Clothing Shopping", "Office Supplies Shopping", "Market Price Comparison", "Bulk Shopping",

    // Special Requests
    "Custom Tasks", "Holiday Decorating", "Gift Wrapping", "Plant Watering",
    "Mail Collection", "Wait in Line Service", "Moving Help",
    "Furniture Assembly", "Basic Home Repairs", "Picture Hanging",

    // Personal Assistant
    "Schedule Management", "Travel Arrangements",
    "Bill Payments", "Phone Call Handling", "Appointment Setting",
    "Research Tasks", "Document Organization", "Task Management", "Personal Errands",

    // Event Planning
    "Birthday Party Planning", "Wedding Planning", "Corporate Event Planning",
    "Venue Scouting", "Decoration Setup", "Catering Coordination",
    "Event Photography", "Guest List Management", "Event Budget Planning", "On-site Event Coordination",

    // Pet Care
    "Dog Walking", "Pet Sitting", "Pet Grooming", "Pet Feeding",
    "Vet Appointment", "Pet Transportation", "Litter Box Cleaning",
    "Pet Supply Shopping", "Dog Training", "Pet Exercise & Play",

    // Home Improvement
    "Painting", "Plumbing Repairs", "Electrical Work", "Carpentry",
    "Tiling", "Wallpaper Installation", "Door/Window Repairs",
    "Flooring Installation", "Shelving Installation", "Cabinet Installation",

    // Automotive
    "Car Washing", "Interior Cleaning", "Oil Change", "Tire Change",
    "Battery Service", "Car Detailing", "Windshield Repair",
    "Car Maintenance", "Jump Start Service", "Fuel Delivery",

    // Tech Support
    "Computer Repair", "Smartphone Setup", "WiFi Setup", "Printer Setup",
    "Software Installation", "Data Recovery", "Smart Home Setup",
    "Virus Removal", "Tech Training", "Computer Cleanup",

    // Others
    "Custom Projects", "Language Translation", "Music Lessons", "Art Lessons",
    "Fitness Training", "Academic Tutoring", "Photography Services",
    "Voice Recording", "Video Editing", "Resume Writing"
  ];
  

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
      // Validate services selection
      if (selectedServices.length !== 3) {
        Alert.alert('Error', 'Please select exactly 3 services you can provide');
        return;
      }
      
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
        name,
        email,
        profileImage: profileImageUrl || null,
        documents: validDocs,
        services: selectedServices, // Store selected services
        createdAt: new Date().toISOString(),
        status: 'pending',
        role: 'runner',
      });
  
      navigation.navigate('RunnerPage');
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message);
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

  const toggleServiceSelection = (service) => {
    if (selectedServices.includes(service)) {
      // Remove service if already selected
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else if (selectedServices.length < 3) {
      // Add service if less than 3 are selected
      setSelectedServices([...selectedServices, service]);
    } else {
      // Alert if trying to select more than 3
      Alert.alert('Limit Reached', 'You can only select up to 3 services');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.headerContainer}>
          <Text style={styles.provider}>Provider</Text>
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
          <Text style={styles.myProfile}>Create Account</Text>
          <Text style={styles.updateYourAccount}>Register as an errand provider</Text>
          
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
            
            <Text style={styles.inputLabel}>Select Services (Choose 3)</Text>
            <View style={styles.servicesContainer}>
              {availableServices.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[
                    styles.serviceItem,
                    selectedServices.includes(service) && styles.selectedServiceItem
                  ]}
                  onPress={() => toggleServiceSelection(service)}
                >
                  <Text 
                    style={[
                      styles.serviceText,
                      selectedServices.includes(service) && styles.selectedServiceText
                    ]}
                  >
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.servicesSelectedText}>
              {selectedServices.length}/3 services selected
            </Text>

            <Text style={styles.inputLabel}>Required Documents</Text>
            <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
              <Text style={styles.uploadButtonText}>Upload Document</Text>
            </TouchableOpacity>
            
            {documents.map((doc, index) => (
              <Text key={index} style={styles.documentName}>{doc.name}</Text>
            ))}

            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={loading}>
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={styles.alreadyHaveAccount}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Profiles")}>
                <Text style={styles.loginText}>Login</Text>
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
  provider: {
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
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  serviceItem: {
    backgroundColor: Color.colorWhite,
    borderRadius: Border.br_11xl,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: Color.colorPaleturquoise,
    minWidth: '30%',
  },
  selectedServiceItem: {
    backgroundColor: Color.colorDarkslategray,
    borderColor: Color.colorDarkslategray,
  },
  serviceText: {
    fontSize: FontSize.size_smi,
    color: Color.colorBlack,
    fontFamily: FontFamily.robotoLight,
  },
  selectedServiceText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.robotoBold,
  },
  servicesSelectedText: {
    fontSize: FontSize.size_smi,
    color: Color.colorDarkslategray,
    fontFamily: FontFamily.robotoBold,
    marginBottom: 15,
    textAlign: 'right',
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
  signupButton: {
    backgroundColor: Color.colorDarkslategray,
    borderRadius: Border.br_11xl,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.montserratSemiBold,
    fontSize: FontSize.size_mini,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alreadyHaveAccount: {
    fontSize: FontSize.size_smi,
    color: Color.colorDarkslategray,
    fontFamily: FontFamily.robotoLight,
    marginRight: 5,
  },
  loginText: {
    fontSize: FontSize.size_smi,
    color: Color.colorDarkslategray,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
  },
});

export default ErrandProviderSignup;