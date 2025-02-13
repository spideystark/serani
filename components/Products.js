import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    StyleSheet 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../utils/firebaseConfig';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Products = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const categories = [
        { id: "grocery_shopping", name: "Grocery & Shopping" },
        { id: "delivery_dropoffs", name: "Delivery & Drop-offs" },
        { id: "household_chores", name: "Household Chores" },
        { id: "personal_assistance", name: "Personal Assistance" },
        { id: "business_services", name: "Business Services" },
        { id: "automotive", name: "Automotive" },
        { id: "special_requests", name: "Special Requests" },
        { id: "urgency_based", name: "Urgency-Based" }
    ];

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const tasksCollection = collection(db, 'tasks');
            const taskSnapshot = await getDocs(tasksCollection);
            const tasksList = taskSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTasks(tasksList);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            alert('Failed to load tasks. Please try again.');
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to upload images.');
                return;
            }
    
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true, // Add this to get base64 data
            });
    
            if (!result.canceled && result.assets[0]) {
                const selectedAsset = result.assets[0];
                console.log('Selected image URI:', selectedAsset.uri); // Log the URI
                setImageUri(selectedAsset.uri);
            }
        } catch (error) {
            console.error('Image pick error:', error);
            alert('Failed to select image. Please try again.');
        }
    };
    
    const uploadImage = async (uri) => {
        try {
            console.log('Starting image upload...');
    
            // Convert URI to Blob
            let blob;
            if (uri.startsWith('file://')) {
                // Handle file:// URIs on Android
                const response = await fetch(uri);
                blob = await response.blob();
            } else {
                // Handle other URIs (e.g., http://, https://)
                const response = await fetch(uri);
                blob = await response.blob();
            }
    
            if (!blob) {
                throw new Error('Failed to convert image to Blob');
            }
    
            // Generate a unique filename
            const filename = `tasks/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
    
            // Create a reference to the storage location
            const storageRef = ref(storage, filename);
    
            // Set metadata for the file
            const metadata = {
                contentType: 'image/jpeg', // Ensure this matches the image type
            };
    
            // Upload the Blob to Firebase Storage
            const snapshot = await uploadBytes(storageRef, blob, metadata);
            console.log('Upload successful:', snapshot);
    
            // Get the download URL for the uploaded file
            const downloadURL = await getDownloadURL(snapshot.ref);
            console.log('Download URL:', downloadURL);
    
            return downloadURL;
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(
                error.code === 'storage/unauthorized'
                    ? 'Not authorized to upload images'
                    : 'Failed to upload image. Please try again.'
            );
        }
    };

    const handleSubmit = async () => {
        if (isLoading) return;
    
        // Validate required fields
        if (!selectedCategory || !serviceName || !price) {
            alert('Please fill in all required fields');
            return;
        }
    
        setIsLoading(true);
        try {
            let imageUrl = '';
            if (imageUri) {
                try {
                    console.log('Starting image upload...');
                    imageUrl = await uploadImage(imageUri);
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (error) {
                    console.error('Image upload failed:', error);
                    setIsLoading(false);
                    alert(error.message);
                    return;
                }
            }
    
            const taskData = {
                category: selectedCategory,
                serviceName: serviceName.trim(),
                description: serviceDescription.trim(),
                price: Number(price),
                imageUrl,
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
    
            await addDoc(collection(db, 'tasks'), taskData);
            await fetchTasks();
            
            // Reset form
            setSelectedCategory('');
            setServiceName('');
            setServiceDescription('');
            setPrice('');
            setImageUri(null);
    
            alert('Task added successfully!');
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to add task. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Admin Task Management</Text>
            
            <View style={styles.form}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Category:</Text>
                    <Picker
                        selectedValue={selectedCategory}
                        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                        style={styles.picker}
                    >
                        <Picker.Item label="Select a category" value="" />
                        {categories.map((category) => (
                            <Picker.Item 
                                key={category.id} 
                                label={category.name} 
                                value={category.id} 
                            />
                        ))}
                    </Picker>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Service Name:</Text>
                    <TextInput
                        style={styles.input}
                        value={serviceName}
                        onChangeText={setServiceName}
                        placeholder="Enter service name"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description:</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={serviceDescription}
                        onChangeText={setServiceDescription}
                        placeholder="Enter description"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Price:</Text>
                    <TextInput
                        style={styles.input}
                        value={price}
                        onChangeText={setPrice}
                        placeholder="Enter price"
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity 
                    style={styles.imagePicker} 
                    onPress={pickImage}
                >
                    <Text style={styles.imagePickerText}>Pick an image</Text>
                </TouchableOpacity>

                {imageUri && (
                    <Image 
                        source={{ uri: imageUri }} 
                        style={styles.previewImage} 
                    />
                )}

                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    <Text style={styles.submitButtonText}>
                        {isLoading ? 'Adding...' : 'Add Task'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tasksList}>
                <Text style={styles.subtitle}>Existing Tasks</Text>
                <View style={styles.tasksGrid}>
                    {tasks.map((task) => (
                        <View key={task.id} style={styles.taskCard}>
                            {task.imageUrl && (
                                <Image 
                                    source={{ uri: task.imageUrl }} 
                                    style={styles.taskImage} 
                                />
                            )}
                            <Text style={styles.taskTitle}>{task.serviceName}</Text>
                            <Text>Category: {task.category}</Text>
                            <Text>Price: ${task.price}</Text>
                            <Text>{task.description}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    form: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 20,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
    },
    imagePicker: {
        backgroundColor: '#e0e0e0',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
        marginBottom: 16,
    },
    imagePickerText: {
        color: '#333',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 4,
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 4,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    tasksList: {
        marginTop: 20,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    tasksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    taskCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        width: '48%',
    },
    taskImage: {
        width: '100%',
        height: 150,
        borderRadius: 4,
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
});

export default Products;