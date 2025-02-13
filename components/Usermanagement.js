import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { db } from '../utils/firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        password: '',
        role: '',
        status: 'pending'
    });

    const roles = [
        { id: 'runner', label: 'Service Provider' },
        { id: 'client', label: 'Client' },
        { id: 'admin', label: 'Administrator' }
    ];

    const fetchUsers = async () => {
        try {
            // Fetch runners
            const runnersCollection = collection(db, 'runners');
            const runnersSnapshot = await getDocs(runnersCollection);
            const runnersList = runnersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'runner'
            }));

            // Fetch users
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                type: 'client'
            }));

            // Combine both lists
            const combinedList = [...runnersList, ...usersList];
            setUsers(combinedList);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch users');
        }
    };

    const registerUser = async () => {
        if (!newUser.role) {
            Alert.alert('Error', 'Please select a role');
            return;
        }

        try {
            // Choose collection based on role
            const collectionName = newUser.role === 'runner' ? 'runners' : 'users';
            await addDoc(collection(db, collectionName), newUser);
            fetchUsers();
            setNewUser({ name: '', email: '', password: '', role: '', status: 'pending' });
            Alert.alert('Success', 'User registered successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to register user');
        }
    };

    const updateUser = async (userId, userType, updatedData) => {
        try {
            const collectionName = userType === 'runner' ? 'runners' : 'users';
            const userRef = doc(db, collectionName, userId);
            await updateDoc(userRef, updatedData);
            fetchUsers();
        } catch (error) {
            Alert.alert('Error', 'Failed to update user');
        }
    };

    const deleteUser = async (userId, userType) => {
        try {
            const collectionName = userType === 'runner' ? 'runners' : 'users';
            const userRef = doc(db, collectionName, userId);
            await deleteDoc(userRef);
            fetchUsers();
            Alert.alert('Success', 'User deleted successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to delete user');
        }
    };

    const approveUser = (userId, userType) => {
        updateUser(userId, userType, { status: 'approved' });
    };

    const RoleSelectionModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={showRoleModal}
            onRequestClose={() => setShowRoleModal(false)}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Role</Text>
                    {roles.map((role) => (
                        <TouchableOpacity
                            key={role.id}
                            style={styles.roleButton}
                            onPress={() => {
                                setNewUser({...newUser, role: role.id});
                                setShowRoleModal(false);
                            }}
                        >
                            <Text style={styles.roleButtonText}>{role.label}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setShowRoleModal(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    useEffect(() => {
        fetchUsers();
    }, []);

    const renderUserSection = (userType, title) => {
        const filteredUsers = users.filter(user => user.type === userType);
        
        return (
            <View style={styles.section}>
                <Text style={styles.subtitle}>{title}</Text>
                {filteredUsers.map((user) => (
                    <View key={user.id} style={styles.userItem}>
                        <Text style={styles.userName}>Name: {user.name}</Text>
                        <Text style={styles.userEmail}>Email: {user.email}</Text>
                        <Text style={styles.userStatus}>Status: {user.status}</Text>
                        <Text style={styles.userRole}>Role: {user.role || user.type}</Text>
                        {user.status === 'pending' && (
                            <TouchableOpacity 
                                style={styles.approveButton}
                                onPress={() => approveUser(user.id, user.type)}
                            >
                                <Text style={styles.buttonText}>Approve</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => deleteUser(user.id, user.type)}
                        >
                            <Text style={styles.buttonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </View>
        );
    };

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
                <TouchableOpacity 
                    style={styles.roleSelectButton}
                    onPress={() => setShowRoleModal(true)}
                >
                    <Text style={styles.roleSelectText}>
                        {newUser.role ? `Selected Role: ${newUser.role}` : 'Select Role'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={registerUser}>
                    <Text style={styles.buttonText}>Register User</Text>
                </TouchableOpacity>
            </View>

            <RoleSelectionModal />

            {renderUserSection('runner', 'Service Providers')}
            {renderUserSection('client', 'Clients')}
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
    section: {
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
        marginBottom: 4,
    },
    userRole: {
        color: '#666',
        marginBottom: 8,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 8,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    roleButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 4,
        marginBottom: 8,
    },
    roleButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#999',
        padding: 12,
        borderRadius: 4,
        marginTop: 8,
    },
    cancelButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    roleSelectButton: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 12,
        marginBottom: 12,
    },
    roleSelectText: {
        color: '#666',
    },
});

export default UserManagement;