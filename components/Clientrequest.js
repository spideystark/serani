import React, { useState } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    ScrollView, 
    StyleSheet,
    KeyboardAvoidingView,
    Platform 
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { db , auth } from '../utils/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const ClientServiceRequest = () => {
    const navigation = useNavigation();
    const [selectedCategory, setSelectedCategory] = useState('');
    const [specificService, setSpecificService] = useState('');
    const [serviceDetails, setServiceDetails] = useState('');
    const [location, setLocation] = useState(null);
    const [locationAddress, setLocationAddress] = useState('');
    const [budget, setBudget] = useState('');
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

    const getLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }

            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // Get address from coordinates
            let geocode = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude
            });

            if (geocode[0]) {
                const address = `${geocode[0].street}, ${geocode[0].city}, ${geocode[0].region}`;
                setLocationAddress(address);
            }
        } catch (error) {
            console.error('Location error:', error);
            alert('Failed to get location. Please try again.');
        }
    };

    const handleSubmit = async () => {
        if (isLoading) return;
    
        if (!selectedCategory || !specificService || !location || !budget) {
            alert('Please fill in all required fields');
            return;
        }
    
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('You must be logged in to submit a request');
            }

            const requestData = {
                category: selectedCategory,
                serviceName: specificService.trim(),
                description: serviceDetails.trim(),
                location: {
                    address: locationAddress,
                    coordinates: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude
                    }
                },
                price: Number(budget),
                status: 'pending',
                clientId: user.uid,
                createdAt: new Date().toISOString(),
                isClientRequest: true
            };
    
            // Add only to tasks collection
            await addDoc(collection(db, 'tasks'), requestData);
            
            // Reset form
            setSelectedCategory('');
            setSpecificService('');
            setServiceDetails('');
            setLocation(null);
            setLocationAddress('');
            setBudget('');
    
            alert('Service request submitted successfully!');
            // Navigate to LocateAndRunner page instead of Dashboard
            navigation.navigate('LocateClientAndRunner');
        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit request. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView 
                style={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Request a Service</Text>
                
                <View style={styles.form}>
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Service Category *</Text>
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
                        <Text style={styles.label}>Specific Service Needed *</Text>
                        <TextInput
                            style={styles.input}
                            value={specificService}
                            onChangeText={setSpecificService}
                            placeholder="e.g., House Cleaning, Grocery Delivery, Babysitting"
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Service Details</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={serviceDetails}
                            onChangeText={setServiceDetails}
                            placeholder="Describe what you need help with..."
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Location *</Text>
                        <TouchableOpacity 
                            style={styles.locationButton} 
                            onPress={getLocation}
                        >
                            <Text style={styles.locationButtonText}>
                                {locationAddress ? locationAddress : "Detect My Location"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={styles.label}>Budget (Ksh) *</Text>
                        <TextInput
                            style={styles.input}
                            value={budget}
                            onChangeText={setBudget}
                            placeholder="Enter your budget"
                            keyboardType="numeric"
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        <Text style={styles.submitButtonText}>
                            {isLoading ? 'Submitting...' : 'Submit Request'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        textAlign: 'center',
        color: '#333',
    },
    form: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontWeight: '500',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    picker: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fafafa',
    },
    submitButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    locationButton: {
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    locationButtonText: {
        color: '#333',
        fontSize: 14,
    }
});

export default ClientServiceRequest;