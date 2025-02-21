import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDoc,getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../utils/firebaseConfig';
import * as Location from 'expo-location';
import { Border, Color, FontFamily, FontSize } from "../GlobalStyles";

const ErrandDashboard = () => {
  const navigation = useNavigation();
  const [showEndTaskModal, setShowEndTaskModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [ongoingTasks, setOngoingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const TaskCard = ({ id, serviceName, status, location, price }) => (
    <TouchableOpacity 
      style={styles.taskCard}
      onPress={() => navigation.navigate('LocateClientAndRunner', { taskId: id })}
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{serviceName}</Text>
        <View style={[styles.badge, styles[`${status}Badge`]]}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.taskDetails}>
        {location?.address ? `📍 ${location.address}` : `💰 KSH ${price}`}
      </Text>
    </TouchableOpacity>
  );

  const CustomModal = ({ visible, onClose, title, description, onConfirm, confirmText, confirmStyle }) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalConfirmButton, confirmStyle]} 
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.modalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const tasksCollection = collection(db, 'tasks');
      
      // Fetch available tasks
      const availableQuery = query(tasksCollection, where('status', '==', 'pending'));
      const availableSnapshot = await getDocs(availableQuery);
      console.log('Available Tasks Raw Data:', availableSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      const availableData = availableSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableTasks(availableData);

      // Fetch ongoing tasks
      const ongoingQuery = query(
        tasksCollection, 
        where('status', '==', 'in-progress'),
        where('runnerId', '==', auth.currentUser?.uid)
      );
      const ongoingSnapshot = await getDocs(ongoingQuery);
      const ongoingData = ongoingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOngoingTasks(ongoingData);

      // Fetch completed tasks
      const completedQuery = query(
        tasksCollection, 
        where('status', '==', 'completed'),
        where('runnerId', '==', auth.currentUser?.uid)
      );
      const completedSnapshot = await getDocs(completedQuery);
      const completedData = completedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompletedTasks(completedData);

    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const shareLocation = async () => {
    try {
      const runnerId = auth.currentUser?.uid;
      if (!runnerId) {
        alert('Please log in to share your location');
        return;
      }
  
      // First check if runner profile exists
      const runnerRef = doc(db, 'runners', runnerId);
      const runnerDoc = await getDoc(runnerRef);
      console.log('Checking runner profile:', runnerDoc.exists());
  
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
  
      // Get current location
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      console.log('Current location obtained:', currentLocation);
  
      // Prepare location update data
      const locationUpdate = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        timestamp: new Date(),
        isAvailable: true,
        lastUpdated: new Date()
      };
  
      // If runner profile exists, merge new data with existing data
      if (runnerDoc.exists()) {
        console.log('Merging with existing runner profile');
        await setDoc(runnerRef, locationUpdate, { merge: true });
      } else {
        // If runner profile doesn't exist, create new profile with default fields
        console.log('Creating new runner profile');
        const initialRunnerData = {
          ...locationUpdate,
          role: 'runner',
          status: 'active',
          runnerId: runnerId,
          createdAt: new Date()
        };
        await setDoc(runnerRef, initialRunnerData);
      }
  
      console.log('Location shared successfully');
      navigation.navigate('LocateClientAndRunner');
  
    } catch (error) {
      console.error('Error sharing location:', error);
      alert('Failed to share location. Please try again.');
    }
  };
  

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const renderTaskList = (tasks, title) => (
    <View style={styles.taskSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView style={styles.taskList}>
        {loading ? (
          <ActivityIndicator size="large" color="#3B82F6" />
        ) : tasks.length > 0 ? (
          tasks.map(task => (
            <TaskCard 
              key={task.id}
              id={task.id}
              serviceName={task.serviceName}
              status={task.status}
              location={task.location}
              price={task.price}
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No {title.toLowerCase()}</Text>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image
              style={styles.menuIcon}
              source={require('../assets/menu.png')}
            />
            <Text style={styles.welcomeText}>Welcome back</Text>
          </View>
          <Image
            style={styles.profileIcon}
            source={require('../assets/unsplashj3lfjn6deo3.png')}
          />
        </View>

        {/* Task Sections */}
        <View style={styles.taskSections}>
          {renderTaskList(availableTasks, "Available Tasks")}
          {renderTaskList(ongoingTasks, "Ongoing Tasks")}
          {renderTaskList(completedTasks, "Completed Tasks")}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statsCard, styles.earningsCard]}>
            <Text style={styles.statsTitleEarnings}>Earnings</Text>
            <Text style={styles.statsValue}>Ksh 24,500.00</Text>
          </View>
          
          <View style={[styles.statsCard, styles.paymentCard]}>
            <ImageBackground 
              source={require('../assets/mpesa.png')} 
              style={styles.imageBackgroundStyle}
              imageStyle={styles.imageBackgroundImageStyle}
            >
              <Text style={styles.statsTitle}>Payment Status</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Up to date</Text>
              </View>
            </ImageBackground>
          </View>
        </View>

          {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.endTaskButton]}
            onPress={() => setShowEndTaskModal(true)}
          >
            <Text style={styles.buttonText}>End Task</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.locationButton]}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.buttonTextLocation}>Location Sharing</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          <MaterialCommunityIcons 
            name="home" 
            size={26} 
            color="#6b7280"
            onPress={() => navigation.navigate('HomePage')} 
          />
          <MaterialCommunityIcons name="account-group" size={26} color="#6b7280" onPress={() => navigation.navigate('Chat')} />
          <MaterialCommunityIcons name="wallet" size={26} color="#6b7280" />
          <MaterialCommunityIcons name="cog" size={26} color="#6b7280" />
        </View>

        {/* Modals */}
        <CustomModal
          visible={showEndTaskModal}
          onClose={() => setShowEndTaskModal(false)}
          title="End Current Task?"
          description="Are you sure you want to end the current task? This action cannot be undone."
          onConfirm={() => console.log('Task ended')}
          confirmText="End Task"
          confirmStyle={styles.endTaskModalButton}
        />

        <CustomModal
          visible={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          title="Share Location"
          description="Share your real-time location with the client? This helps them track their errand progress."
          onConfirm={shareLocation}
          confirmText="Share Location"
          confirmStyle={styles.locationModalButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E3', // Antique white color
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  menuIcon: {
    width: 30,
    height: 30,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  taskSections: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  taskSection: {
    backgroundColor: '#334155', // slate-700
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completedSection: {
    backgroundColor: '#E0F7FA', // cyan-100
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#b0b0b0',
  },
  taskList: {
    maxHeight: 200,
  },
  taskCard: {
    backgroundColor: '#475569', // slate-600
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  taskDetails: {
    fontSize: 14,
    color: '#CBD5E1', // slate-300
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#64748B', // slate-500
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#FCD34D', // yellow-400
  },
  'in-progressBadge': {
    backgroundColor: '#60A5FA', // blue-400
  },
  completedBadge: {
    backgroundColor: '#34D399', // emerald-400
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    height: 100, // Add a fixed height
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: Color.colorPaleturquoise, // blue-500
  },
  paymentCard: {
    backgroundColor: 'white', // purple-500
  },
  statsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  statsTitleEarnings: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  statsValue: {
    color: 'black',
    fontSize: 24,
    fontWeight: '700',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 80,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },

  endTaskButton: {
    backgroundColor: '#EF4444', // red-500
  },
  locationButton: {
    backgroundColor: Color.colorPaleturquoise, // blue-500
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextLocation: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: '#64748B',
    borderRadius: 8,
    padding: 12,
  },
  modalConfirmButton: {
    borderRadius: 8,
    padding: 12,
  },
  endTaskModalButton: {
    backgroundColor: '#EF4444',
  },
  locationModalButton: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  imageBackgroundStyle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageBackgroundImageStyle: {
    borderRadius: 12,
  },
});

export default ErrandDashboard;