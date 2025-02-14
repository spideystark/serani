import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, doc, setDoc, onSnapshot, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../utils/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

// Base location tracking component that handles common functionality
const BaseLocationTracker = ({ children, onLocationUpdate }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let locationSubscription = null;

    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Location permission denied');
          setLoading(false);
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });

        setLocation(initialLocation.coords);
        onLocationUpdate?.(initialLocation.coords);

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10
          },
          (newLocation) => {
            setLocation(newLocation.coords);
            onLocationUpdate?.(newLocation.coords);
          }
        );

        setLoading(false);
      } catch (error) {
        console.error('Location initialization error:', error);
        setErrorMsg('Failed to get location');
        setLoading(false);
      }
    };

    initializeLocation();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMsg}</Text>
      </View>
    );
  }

  return children(location);
};

// Client interface showing available runners and their tasks
const ClientInterface = () => {
  const navigation = useNavigation();
  const [availableRunners, setAvailableRunners] = useState([]);
  const [userTasks, setUserTasks] = useState([]);

  useEffect(() => {
    // Subscribe to available runners
    const runnersRef = collection(db, 'runners');
    const runnersQuery = query(
      runnersRef,
      where('isAvailable', '==', true)
    );

    const unsubscribeRunners = onSnapshot(runnersQuery, (snapshot) => {
      const runners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        coordinates: {
          latitude: doc.data().location?.latitude,
          longitude: doc.data().location?.longitude
        }
      })).filter(runner => runner.coordinates.latitude && runner.coordinates.longitude);
      
      setAvailableRunners(runners);
    });

    // Subscribe to all pending tasks instead of user-specific tasks
    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(tasksRef, where('status', '==', 'pending'));

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(task => task.location?.coordinates?.latitude && task.location?.coordinates?.longitude);
      
      setUserTasks(tasks);
    });

    return () => {
      unsubscribeRunners();
      unsubscribeTasks();
    };
  }, []);

  return (
    <BaseLocationTracker>
      {(location) => (
        <View style={styles.container}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {/* Client's location */}
            <Marker
              coordinate={location}
              title="Your Location"
              pinColor="#2196F3"
            />

            {/* Available runners */}
            {availableRunners.map((runner) => (
              <Marker
                key={runner.id}
                coordinate={runner.coordinates}
                title={runner.name}
              >
                <View style={styles.runnerMarker}>
                  <Text style={styles.runnerName}>{runner.name}</Text>
                  <Text style={styles.runnerRating}>⭐ {runner.rating?.toFixed(1) || '0.0'}</Text>
                  <Text style={styles.runnerTasks}>{runner.completedTasks || 0} tasks</Text>
                </View>
              </Marker>
            ))}

            {/* User's tasks */}
            {userTasks.map((task) => (
              <Marker
                key={task.id}
                coordinate={task.location.coordinates}
                title={task.serviceName}
              >
                <View style={[styles.taskMarker, { borderColor: getStatusColor(task.status) }]}>
                  <Text style={styles.taskTitle}>{task.serviceName}</Text>
                  <Text style={styles.taskPrice}>KES {task.price}</Text>
                  <Text style={styles.taskStatus}>{task.status}</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name="arrow-undo-outline" 
              size={24} 
              color="#000"
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.overlay}>
            <Text style={styles.overlayText}>
              Available Runners: {availableRunners.length}
            </Text>
            <Text style={styles.overlayText}>
              Active Tasks: {userTasks.filter(t => t.status === 'pending').length}
            </Text>
          </View>
        </View>
      )}
    </BaseLocationTracker>
  );
};

// Runner interface showing available tasks
const RunnerInterface = () => {
  const navigation = useNavigation();
  const [availableTasks, setAvailableTasks] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);

  // Add the missing updateRunnerLocation function
  const updateRunnerLocation = async (coords) => {
    try {
      // Assuming you have the current user's ID from authentication
      const runnerId = auth.currentUser?.uid;
      if (!runnerId) return;

      const runnerRef = doc(db, 'runners', runnerId);
      await setDoc(runnerRef, {
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          timestamp: new Date().toISOString()
        },
        isAvailable,
        lastUpdated: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating runner location:', error);
    }
  };

  useEffect(() => {
    const tasksRef = collection(db, 'tasks');
    const tasksQuery = query(tasksRef, where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(task => task.location?.coordinates?.latitude && task.location?.coordinates?.longitude);
      
      setAvailableTasks(tasks);
    });

    return () => unsubscribe();
  }, []);

  const toggleAvailability = async () => {
    setIsAvailable(!isAvailable);
  };

  return (
    <BaseLocationTracker onLocationUpdate={updateRunnerLocation}>
      {(location) => (
        <View style={styles.container}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {/* Runner's location */}
            <Marker
              coordinate={location}
              title="Your Location"
              pinColor="#4CAF50"
            />

            {/* Available tasks */}
            {availableTasks.map((task) => (
              <Marker
                key={task.id}
                coordinate={task.location.coordinates}
                title={task.serviceName}
              >
                <View style={styles.taskMarker}>
                  <Text style={styles.taskTitle}>{task.serviceName}</Text>
                  <Text style={styles.taskPrice}>KES {task.price}</Text>
                  <Text style={styles.taskCategory}>{task.category}</Text>
                  <Text style={styles.taskAddress} numberOfLines={2}>
                    {task.location.address}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons 
              name="arrow-undo-outline" 
              size={24} 
              color="#000"
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.overlay}>
            <TouchableOpacity
              style={[
                styles.availabilityButton,
                { backgroundColor: isAvailable ? '#4CAF50' : '#F44336' }
              ]}
              onPress={toggleAvailability}
            >
              <Text style={styles.availabilityText}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.overlayText}>
              Available Tasks: {availableTasks.length}
            </Text>
          </View>
        </View>
      )}
    </BaseLocationTracker>
  );
};

// Main component that determines the interface based on user type
const LocationTracker = () => {
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const userId = auth.currentUser?.uid;
        console.log('Current user ID:', userId); // Debug log

        if (!userId) {
          console.log('No authenticated user found'); // Debug log
          setError('No authenticated user found');
          setLoading(false);
          return;
        }

        // First, check if user exists in users collection
        const userDoc = await getDoc(doc(db, 'users', userId));
        console.log('User document exists:', userDoc.exists()); // Debug log

        // Then check if user exists in runners collection
        const runnerDoc = await getDoc(doc(db, 'runners', userId));
        console.log('Runner document exists:', runnerDoc.exists()); // Debug log

        if (userDoc.exists()) {
          console.log('Setting user type to client'); // Debug log
          setUserType('client');
          setLoading(false);
          return;
        }

        if (runnerDoc.exists()) {
          console.log('Setting user type to runner'); // Debug log
          setUserType('runner');
          setLoading(false);
          return;
        }

        console.log('User not found in any collection'); // Debug log
        setError('User not found in any collection');
        setLoading(false);
      } catch (error) {
        console.error('Error checking user type:', error);
        setError('Failed to determine user type');
        setLoading(false);
      }
    };

    // Add listener for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed, user:', user?.uid); // Debug log
      if (user) {
        checkUserType();
      } else {
        setError('No authenticated user');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Add debug display
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading your interface...</Text>
        <Text style={styles.debugText}>Checking user type...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.debugText}>User ID: {auth.currentUser?.uid || 'None'}</Text>
      </View>
    );
  }

  if (!userType) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Unable to determine user type</Text>
        <Text style={styles.debugText}>
          User ID: {auth.currentUser?.uid || 'None'}
          {'\n'}Type: {userType || 'None'}
        </Text>
      </View>
    );
  }

  console.log('Rendering interface for user type:', userType); // Debug log
  return userType === 'client' ? <ClientInterface /> : <RunnerInterface />;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'in_progress':
      return '#4CAF50';
    case 'completed':
      return '#2196F3';
    case 'cancelled':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    margin: 20,
  },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlayText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    marginVertical: 2,
  },
  runnerMarker: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    minWidth: 120,
  },
  runnerName: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  runnerRating: {
    fontSize: 12,
    color: '#FFA500',
  },
  runnerTasks: {
    fontSize: 11,
    color: '#666',
  },
  taskMarker: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFA500',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
    color: '#333',
  },
  taskPrice: {
    fontSize: 15,
    color: '#4CAF50',
    fontWeight: '600',
  },
  taskCategory: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  taskAddress: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  taskStatus: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  availabilityButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  availabilityText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  debugText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  interfaceButton: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    maxWidth: 300,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },

});

export default LocationTracker;