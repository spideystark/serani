import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    Image, 
    ScrollView, 
    StyleSheet,
    Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { db, storage } from '../utils/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const Products = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [serviceDescription, setServiceDescription] = useState('');
    const [price, setPrice] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

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
            Alert.alert('Error', 'Failed to load tasks. Please try again.');
        }
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
                return;
            }
    
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });
    
            if (!result.canceled && result.assets[0]) {
                const selectedAsset = result.assets[0];
                setImageUri(selectedAsset.uri);
            }
        } catch (error) {
            console.error('Image pick error:', error);
            Alert.alert('Error', 'Failed to select image. Please try again.');
        }
    };

    const uploadImage = async (uri) => {
        try {
            let blob;
            if (uri.startsWith('file://')) {
                const response = await fetch(uri);
                blob = await response.blob();
            } else {
                const response = await fetch(uri);
                blob = await response.blob();
            }

            if (!blob) {
                throw new Error('Failed to convert image to Blob');
            }

            const filename = `tasks/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
            const storageRef = ref(storage, filename);
            const metadata = {
                contentType: 'image/jpeg',
            };

            const snapshot = await uploadBytes(storageRef, blob, metadata);
            return await getDownloadURL(snapshot.ref);
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error(
                error.code === 'storage/unauthorized'
                    ? 'Not authorized to upload images'
                    : 'Failed to upload image. Please try again.'
            );
        }
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setSelectedCategory(task.category);
        setServiceName(task.serviceName);
        setServiceDescription(task.description);
        setPrice(task.price.toString());
        setImageUri(task.imageUrl);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleDelete = async (taskId) => {
        Alert.alert(
            "Delete Service",
            "Are you sure you want to delete this service?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'tasks', taskId));
                            setTasks(tasks.filter(task => task.id !== taskId));
                            Alert.alert("Success", "Service deleted successfully!");
                        } catch (error) {
                            console.error('Delete error:', error);
                            Alert.alert("Error", "Failed to delete service. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!selectedCategory || !serviceName || !price) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        try {
            let imageUrl = imageUri;
            if (imageUri && !imageUri.startsWith('http')) {
                try {
                    imageUrl = await uploadImage(imageUri);
                } catch (error) {
                    console.error('Image upload failed:', error);
                    setIsLoading(false);
                    Alert.alert('Error', error.message);
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
                updatedAt: new Date().toISOString()
            };

            if (editingTask) {
                await updateDoc(doc(db, 'tasks', editingTask.id), taskData);
                setTasks(tasks.map(task => 
                    task.id === editingTask.id ? { ...task, ...taskData } : task
                ));
                setEditingTask(null);
            } else {
                taskData.createdAt = new Date().toISOString();
                await addDoc(collection(db, 'tasks'), taskData);
                await fetchTasks();
            }

            setSelectedCategory('');
            setServiceName('');
            setServiceDescription('');
            setPrice('');
            setImageUri(null);

            Alert.alert('Success', `Service ${editingTask ? 'updated' : 'added'} successfully!`);
        } catch (error) {
            console.error('Submit error:', error);
            Alert.alert('Error', 'Failed to save service. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const scrollViewRef = React.createRef();

    return (
        <ScrollView ref={scrollViewRef} style={styles.container}>
            <Text style={styles.title}>
                {editingTask ? 'Edit Service' : 'Add New Service'}
            </Text>
            
            <View style={styles.form}>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Category:</Text>
                    <Picker
                        selectedValue={selectedCategory}
                        onValueChange={setSelectedCategory}
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
                        {isLoading ? 'Saving...' : editingTask ? 'Update Service' : 'Add Service'}
                    </Text>
                </TouchableOpacity>

                {editingTask && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                            setEditingTask(null);
                            setSelectedCategory('');
                            setServiceName('');
                            setServiceDescription('');
                            setPrice('');
                            setImageUri(null);
                        }}
                    >
                        <Text style={styles.cancelButtonText}>Cancel Edit</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.tasksList}>
                <Text style={styles.subtitle}>Existing Services</Text>
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
                            <Text style={styles.taskCategory}>
                                {categories.find(c => c.id === task.category)?.name || task.category}
                            </Text>
                            <Text style={styles.taskPrice}>Ksh {task.price}</Text>
                            <Text style={styles.taskDescription} numberOfLines={3}>
                                {task.description}
                            </Text>
                            
                            <View style={styles.taskActions}>
                                <TouchableOpacity 
                                    style={styles.editButton}
                                    onPress={() => handleEdit(task)}
                                >
                                    <Text style={styles.editButtonText}>Edit</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(task.id)}
                                >
                                    <Text style={styles.deleteButtonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
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
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 24,
        color: '#1a1a1a',
        textAlign: 'center',
    },
    form: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
        color: '#333',
        fontSize: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f8f8f8',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 8,
        backgroundColor: '#f8f8f8',
    },
    imagePicker: {
        backgroundColor: '#f0f0f0',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    imagePickerText: {
        color: '#444',
        fontSize: 16,
        fontWeight: '500',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 20,
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    tasksList: {
        marginTop: 24,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#1a1a1a',
    },
    tasksGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    taskCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        width: '46%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    taskImage: {
        width: '100%',
        height: 160,
        borderRadius: 8,
        marginBottom: 12,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1a1a1a',
    },
    taskCategory: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
    },
    taskPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF',
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 14,
        color: '#444',
        marginBottom: 12,
    },
    taskActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
    editButton: {
        backgroundColor: '#4CAF50',
        padding: 8,
        borderRadius: 6,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        padding: 8,
        borderRadius: 6,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default Products;