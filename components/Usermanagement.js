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
        padding: 20,
        backgroundColor: '#f8fafc',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 24,
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    form: {
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f8fafc',
        color: '#334155',
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    approveButton: {
        backgroundColor: '#10b981',
        padding: 12,
        borderRadius: 10,
        marginVertical: 8,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    deleteButton: {
        backgroundColor: '#ef4444',
        padding: 12,
        borderRadius: 10,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    section: {
        marginTop: 32,
    },
    subtitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 20,
        color: '#1e293b',
        letterSpacing: 0.5,
    },
    userItem: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    userName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    userEmail: {
        color: '#64748b',
        marginVertical: 6,
        fontSize: 16,
    },
    userStatus: {
        color: '#64748b',
        marginBottom: 6,
        fontSize: 16,
    },
    userRole: {
        color: '#64748b',
        marginBottom: 12,
        fontSize: 16,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    modalContent: {
        backgroundColor: '#ffffff',
        padding: 24,
        borderRadius: 20,
        width: '85%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
        color: '#1e293b',
    },
    roleButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#3b82f6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    roleButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#94a3b8',
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
        shadowColor: '#94a3b8',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    cancelButtonText: {
        color: '#ffffff',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    roleSelectButton: {
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#f8fafc',
    },
    roleSelectText: {
        color: '#64748b',
        fontSize: 16,
    },
});

export default UserManagement;