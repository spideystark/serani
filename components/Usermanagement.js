import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { db } from '../utils/firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: 'provider',
        status: 'pending'
    });

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const snapshot = await getDocs(usersCollection);
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch users');
        }
    };

    const registerUser = async () => {
        try {
            await addDoc(collection(db, 'users'), newUser);
            fetchUsers();
            setNewUser({ name: '', email: '', password: '', role: 'provider', status: 'pending' });
            Alert.alert('Success', 'User registered successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to register user');
        }
    };

    const updateUser = async (userId, updatedData) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, updatedData);
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', 'Failed to update user');
        }
    };

    const deleteUser = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            await deleteDoc(userRef);
            fetchUsers();
            Alert.alert('Success', 'User deleted successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to delete user');
        }
    };

    const approveUser = (userId) => {
        updateUser(userId, { status: 'approved' });
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>User Management</Text>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={newUser.name}
                    onChangeText={(text) => setNewUser({...newUser, name: text})}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={newUser.email}
                    onChangeText={(text) => setNewUser({...newUser, email: text})}
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={newUser.password}
                    onChangeText={(text) => setNewUser({...newUser, password: text})}
                    secureTextEntry
                />
                <TouchableOpacity style={styles.button} onPress={registerUser}>
                    <Text style={styles.buttonText}>Register Service Provider</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.usersList}>
                <Text style={styles.subtitle}>Service Providers</Text>
                {users.map((user) => (
                    <View key={user.id} style={styles.userItem}>
                        <Text style={styles.userName}>Name: {user.name}</Text>
                        <Text style={styles.userEmail}>Email: {user.email}</Text>
                        <Text style={styles.userStatus}>Status: {user.status}</Text>
                        {user.status === 'pending' && (
                            <TouchableOpacity 
                                style={styles.approveButton}
                                onPress={() => approveUser(user.id)}
                            >
                                <Text style={styles.buttonText}>Approve</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => deleteUser(user.id)}
                        >
                            <Text style={styles.buttonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ))}
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
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        marginBottom: 12,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 4,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#34C759',
        padding: 8,
        borderRadius: 4,
        marginVertical: 4,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        padding: 8,
        borderRadius: 4,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    usersList: {
        marginTop: 20,
    },
    subtitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    userItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
    },
    userEmail: {
        color: '#666',
        marginVertical: 4,
    },
    userStatus: {
        color: '#666',
        marginBottom: 8,
    },
});

export default UserManagement;