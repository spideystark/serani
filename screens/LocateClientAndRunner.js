import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { collection, doc, setDoc, onSnapshot, query, where, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

// Utility function to calculate distance between two coordinates in kilometers
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI/180);
};

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
  const [currentUserData, setCurrentUserData] = useState(null);
  const [filteredRunners, setFilteredRunners] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [routeToRunner, setRouteToRunner] = useState(null);
  const MAX_DISTANCE = 6; // Maximum distance in kilometers

  // Fetch current user data to determine relevance
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

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

    return () => {
      unsubscribeRunners();
    };
  }, []);

  // Filter runners based on location, relevance, and service categories
  useEffect(() => {
    if (!userLocation) return;

    const nearbyRunners = availableRunners.filter(runner => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        runner.coordinates.latitude,
        runner.coordinates.longitude
      );
      
      // Filter by distance and service categories
      const isNearby = distance <= MAX_DISTANCE;
      const hasMatchingServices = currentUserData?.preferredCategories 
        ? runner.serviceCategories?.some(cat => 
            currentUserData.preferredCategories.includes(cat)
          )
        : true;

      return isNearby && hasMatchingServices;
    });

    setFilteredRunners(nearbyRunners);

    // Update route if a runner is selected
    if (selectedRunner) {
      const runnerCoords = selectedRunner.coordinates;
      // Simple straight line path - in a real app, you'd use a routing service
      setRouteToRunner([
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: runnerCoords.latitude, longitude: runnerCoords.longitude }
      ]);
    }
  }, [userLocation, availableRunners, currentUserData, selectedRunner]);

  const handleLocationUpdate = (location) => {
    setUserLocation(location);
  };

  // Check runner availability and show booking confirmation
  const checkAvailabilityAndBook = async (runner) => {
    try {
      // Validate runner data first
      if (!runner || !runner.id) {
        Alert.alert('Error', 'Invalid runner data. Please try again.');
        return;
      }
  
      // Real-time check of runner's current status
      const runnerDoc = await getDoc(doc(db, 'runners', runner.id));
      
      if (!runnerDoc.exists()) {
        Alert.alert('Runner Not Found', 'This runner is no longer available.');
        setSelectedRunner(null);
        setRouteToRunner(null);
        return;
      }
      
      const currentRunnerData = runnerDoc.data();
  
      if (!currentRunnerData.isAvailable) {
        Alert.alert(
          'Runner Unavailable',
          'This runner is no longer available. Please select another runner.'
        );
        setSelectedRunner(null);
        setRouteToRunner(null);
        return;
      }
  
      // Make sure we have valid coordinates for distance calculation
      if (!userLocation || !runner.coordinates || 
          !runner.coordinates.latitude || !runner.coordinates.longitude) {
        Alert.alert('Location Error', 'Unable to determine location. Please try again.');
        return;
      }
  
      // Check if runner is within service area
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        runner.coordinates.latitude,
        runner.coordinates.longitude
      );
  
      if (distance > MAX_DISTANCE) {
        Alert.alert(
          'Outside Service Area',
          'This runner is now outside your service area. Please select a closer runner.'
        );
        setSelectedRunner(null);
        setRouteToRunner(null);
        return;
      }
  
      setSelectedRunner(runner);
  
      // Show booking confirmation dialog with safe default values
      const runnerName = runner.name || 'Selected Runner';
      const runnerRating = runner.rating ? runner.rating.toFixed(1) : '0.0';
      const completedTasks = runner.completedTasks || 0;
  
      Alert.alert(
        'Confirm Booking',
        `Would you like to book ${runnerName}?\n\nRating: ${runnerRating}⭐\nCompleted Tasks: ${completedTasks}\nDistance: ${distance.toFixed(1)}km`,
        [
          {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => {
          setSelectedRunner(null);
          setRouteToRunner(null);
          navigation.goBack(); // Navigate to previous screen
        }
          },
          {
        text: 'Book Now', 
        onPress: () => initiateBooking(runner)
          }
        ]
      );
    } catch (error) {
      console.error('Error checking runner availability:', error);
      Alert.alert('Error', 'Failed to check runner availability. Please try again.');
      setSelectedRunner(null);
      setRouteToRunner(null);
    }
  };

  const initiateBooking = async (runner) => {
    try {
      // Check if there's an existing pending task for this runner and client
      const tasksRef = collection(db, 'tasks');
      const existingTaskQuery = query(
        tasksRef,
        where('runnerId', '==', runner.id),
        where('clientId', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const existingTaskSnapshot = await getDocs(existingTaskQuery);
      let taskId;
      
      if (!existingTaskSnapshot.empty) {
        // Use existing task
        taskId = existingTaskSnapshot.docs[0].id;
      } else {
        // Create a new task document only if one doesn't exist
        const taskRef = doc(collection(db, 'tasks'));
        taskId = taskRef.id;
        
        const newTask = {
          id: taskId,
          runnerId: runner.id,
          clientId: auth.currentUser.uid,
          status: 'pending',
          createdAt: new Date().toISOString(),
          location: {
            coordinates: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          },
        };
      
        await setDoc(taskRef, newTask);
      }
      
      // Check if chat already exists for this task
      const chatRef = doc(db, 'chats', taskId);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        // Create the chat collection only if it doesn't exist
        await setDoc(chatRef, {
          taskId: taskId,
          runnerId: runner.id,
          clientId: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          lastMessage: null,
          lastMessageTime: null
        });
      }
  
      Alert.alert(
        'Booking Successful',
        'Your booking has been confirmed. The runner will be notified.',
        [{ 
          text: 'OK',
          onPress: () => {
            setSelectedRunner(null);
            setRouteToRunner(null);
            // Navigate to chat screen
            navigation.navigate('Chat', {
              taskId: taskId,
              runnerId: runner.id,
              clientId: auth.currentUser.uid
            });
          }
        }]
      );
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    }
  };

  return (
    <BaseLocationTracker onLocationUpdate={handleLocationUpdate}>
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

            {/* Available runners (filtered) */}
            {filteredRunners.map((runner) => {
  // Skip invalid runner data
              if (!runner || !runner.id || !runner.coordinates ||
                !runner.coordinates.latitude || !runner.coordinates.longitude) {
                return null;
              }

              return (
                <Marker
                  key={runner.id}
                  coordinate={runner.coordinates}
                  title={runner.name || 'Runner'}
                  onPress={() => checkAvailabilityAndBook(runner)}
                >
                  <View style={styles.runnerMarker}>
                    <Text style={styles.runnerName}>{runner.name || 'Runner'}</Text>
                    <Text style={styles.runnerRating}>⭐ {runner.rating?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.runnerTasks}>{runner.completedTasks || 0} tasks</Text>
                    <Text style={styles.distanceText}>
                      {calculateDistance(
                        location.latitude,
                        location.longitude,
                        runner.coordinates.latitude,
                        runner.coordinates.longitude
                      ).toFixed(1)} km
                    </Text>
                  </View>
                </Marker>
              );
            }

            )}

            {/* Path to selected runner */}
            {routeToRunner && (
              <Polyline
                coordinates={routeToRunner}
                strokeColor="#2196F3"
                strokeWidth={3}
                lineDashPattern={[1]}
              />
            )}
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
              Available Runners : {filteredRunners.length}
            </Text>
            {currentUserData?.preferredCategories && (
              <Text style={styles.overlaySubtext}>
                Showing runners matching your preferred services
              </Text>
            )}
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
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [runnerProfile, setRunnerProfile] = useState(null);
  const MAX_DISTANCE = 6; // Maximum distance in kilometers

  // Fetch runner profile to determine task appropriateness
  useEffect(() => {
    const fetchRunnerProfile = async () => {
      try {
        const runnerId = auth.currentUser?.uid;
        if (!runnerId) return;

        const runnerDoc = await getDoc(doc(db, 'runners', runnerId));
        if (runnerDoc.exists()) {
          setRunnerProfile(runnerDoc.data());
        }
      } catch (error) {
        console.error('Error fetching runner profile:', error);
      }
    };

    fetchRunnerProfile();
  }, []);

  // Add the missing updateRunnerLocation function
  const updateRunnerLocation = async (coords) => {
    try {
      // Assuming you have the current user's ID from authentication
      const runnerId = auth.currentUser?.uid;
      if (!runnerId) return;

      setUserLocation(coords);

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

  // Filter tasks by distance and appropriateness when tasks or location changes
  useEffect(() => {
    if (!userLocation || !availableTasks.length) return;

    // Filter tasks by distance (within 6km)
    const nearbyTasks = availableTasks.filter(task => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        task.location.coordinates.latitude,
        task.location.coordinates.longitude
      );
      
      return distance <= MAX_DISTANCE;
    });

    // Filter by task appropriateness if runner profile is available
    const appropriateTasks = runnerProfile 
      ? nearbyTasks.filter(task => {
          // Example: Check if runner has skills matching the task category
          // Replace with your actual appropriateness logic
          return runnerProfile.skills && 
                 task.category && 
                 runnerProfile.skills.includes(task.category);
        })
      : nearbyTasks;

    // Fall back to nearby tasks if no appropriate tasks found or no runner profile
    setFilteredTasks(appropriateTasks.length > 0 ? appropriateTasks : nearbyTasks);
  }, [userLocation, availableTasks, runnerProfile]);

  const toggleAvailability = async () => {
    setIsAvailable(!isAvailable);
    // Update availability status in Firestore
    if (userLocation) {
      updateRunnerLocation(userLocation);
    }
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

            {/* Available tasks (filtered) */}
            {filteredTasks.map((task) => (
              <Marker
                key={task.id}
                coordinate={task.location.coordinates}
                title={task.serviceName}
              >
                <View style={styles.taskMarker}>
                  <Text style={styles.taskTitle}>{task.serviceName}</Text>
                  <Text style={styles.taskPrice}>KES {task.price}</Text>
                  <Text style={styles.taskCategory}>{task.category}</Text>
                  <Text style={styles.distanceText}>
                    {calculateDistance(
                      location.latitude,
                      location.longitude,
                      task.location.coordinates.latitude,
                      task.location.coordinates.longitude
                    ).toFixed(1)} km
                  </Text>
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
              Available Tasks (within {MAX_DISTANCE}km): {filteredTasks.length}
            </Text>
            <Text style={styles.overlaySubtext}>
              {runnerProfile?.skills ? 'Showing tasks matching your skills' : 'Showing all nearby tasks'}
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
  overlaySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  distanceText: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: 'bold',
    marginTop: 4,
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